import * as fastq from "fastq";
import { Logger } from "../../../../libs/src/logger/logger";
import { Cache } from "../../../../libs/src/cache";
import { SequelizeManager } from "../../../../libs/src/sequelize/sequelize";
import { ProgressBar } from "../../../../libs/src/utils";
import { GoogleMapsScraper, IAddPlacePayload } from "./google-maps-scraper";
import { IGoogleSearchPlace } from "../../../../interfaces";

export interface IExploreNewPlacesConfig {
  scraper: GoogleMapsScraper;
  logger: Logger;
  cache: Cache;
  concurrency: number;
  country: string;
  sequelizeManager: SequelizeManager;
}

interface IWorkerResponse {
  that: any;
  newPlaces: IGoogleSearchPlace[];
  coordinates: number[];
}

export class ExplorePlaces {
  private readonly scraper: GoogleMapsScraper;
  private readonly sequelizeManager: SequelizeManager;
  private readonly logger: Logger;
  private readonly cache: Cache;
  private readonly progressBar: ProgressBar;
  private readonly concurrency: number;
  private readonly country: string;

  constructor(config: IExploreNewPlacesConfig) {
    this.scraper = config.scraper;
    this.sequelizeManager = config.sequelizeManager;
    this.logger = config.logger;
    this.cache = config.cache;
    this.concurrency = config.concurrency;
    this.country = config.country;
    this.progressBar = new ProgressBar();
  }

  public async run() {
    let totalCoordinates = 0;
    let handledCoordinates = 0;
    const placeIds = await this.scraper.getAllPlaceIds();
    const queue = fastq.default(this.worker, this.concurrency);
    for await (const coordinates of this.scraper.streamCoordinates()) {
      const key = JSON.stringify(coordinates);
      if (this.cache.has(key)) {
        handledCoordinates++;
        this.logger.debug(
          `Coordinates ${key} are already handled. Skipping...`
        );
        continue;
      }
      totalCoordinates++;
      queue.push(
        {
          that: this,
          coordinates,
          placeIds
        },
        this.handleWorkerResponse
      );
    }
    this.logger.info(`${handledCoordinates} coordinates are already handled`);
    this.progressBar.start(totalCoordinates);
  }

  private async handleWorkerResponse(
    err,
    response: IWorkerResponse
  ): Promise<void> {
    if (err) throw err;
    const { that, newPlaces, coordinates } = response;
    if (newPlaces.length > 0) {
      const placeIds = [...new Set(newPlaces.map(place => place.place_id))];
      that.logger.info(`Found ${placeIds.length} new places`);
      const records: Partial<IAddPlacePayload>[] = placeIds.map(id => ({
        placeId: id,
        country: that.country
      }));
      await that.scraper.addPlacesToDb(records);
    }
    that.cache.set(
      JSON.stringify(coordinates),
      { newPlaceIds: newPlaces.map(p => p.place_id), coordinates },
      parseInt(process.env.CACHE_TTL)
    );
    that.progressBar.increment();
  }

  private async worker({ that, coordinates, placeIds }, cb): Promise<void> {
    try {
      const places: IGoogleSearchPlace[] =
        await that.scraper.getPlacesByCoordinates(coordinates);
      const newPlaces = places.filter(
        place => !placeIds.includes(place.place_id) // TODO: Change to db call
      );
      cb(null, { that, newPlaces, coordinates });
    } catch (e) {
      cb(e);
    }
  }
}
