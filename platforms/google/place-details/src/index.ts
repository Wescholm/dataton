import path from "path";
import * as dotenv from "dotenv";
import * as fastq from "fastq";
import * as minimist from "minimist";
dotenv.config({ path: path.join(__dirname, ".env") });
import { GoogleMapsScraper, IAddPlacePayload, IGoogleMapsConfig } from "./google-maps-scraper.js";
import { SequelizeManager } from "../../../../libs/src/sequelize/sequelize";
import { Logger, LogLevel } from "../../../../libs/src/logger/logger";
import { Cache, ICacheConfig } from "../../../../libs/src/cache";
import { IGoogleSearchPlace } from "../../../../interfaces";

interface IFindNewWorkerResponse {
    newPlaces: IGoogleSearchPlace[];
    coordinates: number[];
}

const argv = minimist.default(process.argv.slice(2), {
    string: ["country", "week"],
    number: ["concurrency"],
    default: {
        concurrency: 10,
    }
});

const WEEK = argv.week;
const COUNTRY = argv.country;
const CONCURRENCY = argv.concurrency;

const logger = new Logger({
    level: LogLevel[process.env.LOG_LEVEL],
    prefix: "GoogleMapsScraper"
});

const sequelizeConfig = {
    dialect: process.env.PSQL_DIALECT,
    host: process.env.PSQL_HOST,
    port: parseInt(process.env.PSQL_PORT),
    database: process.env.PSQL_DATABASE,
    username: process.env.PSQL_USERNAME,
    password: process.env.PSQL_PASSWORD
};

const cacheConfig: ICacheConfig = {
    cacheName: process.env.CACHE_NAME,
    cachePath: process.env.CACHE_PATH,
    keyPrefix: `${COUNTRY}::${WEEK}`,
    saveInterval: parseInt(process.env.CACHE_SAVE_INTERVAL)
}

const cache = new Cache(cacheConfig);
const sequelizeManager = new SequelizeManager(sequelizeConfig);

const scraperConfig: IGoogleMapsConfig = {
    apiKeys: [
        "AIzaSyDZbWNBK81yJVvpc5wRfCLwPyLYsGpwRbQ",
        "AIzaSyAJV0pH9dpVwdNZeLajIGsIpjcPu3tVgAE"
    ],
    proxyUrl: process.env.PROXY_URL,
    maxRetries: parseInt(process.env.MAX_RETRIES),
    sequelizeManager
};

const scraper = new GoogleMapsScraper(scraperConfig);

const findNewPlaces = async (): Promise<void> => {
    const placeIds = await scraper.getAllPlaceIds();
    const queue = fastq.default(findNewWorker, CONCURRENCY);
    for await (const coordinates of scraper.streamCoordinates()) {
        const key = JSON.stringify(coordinates);
        if (cache.has(key)) {
            logger.info(`Coordinates ${key} are already handled`);
            continue;
        }
        queue.push({ coordinates, placeIds }, handleNewPlacesResponse);
    }
};

const handleNewPlacesResponse = async (
  err,
  response: IFindNewWorkerResponse
): Promise<void> => {
    if (err) throw err;
    const { newPlaces, coordinates } = response;
    if (newPlaces.length > 0) {
        const placeIds = [...new Set(newPlaces.map(place => place.place_id))];
        logger.info(`Found ${placeIds.length} new places`);
        const records: Partial<IAddPlacePayload>[] = placeIds.map(
          id => ({ placeId: id, country: COUNTRY })
        );
        await scraper.addPlacesToDb(records);
    }
    cache.set(
      JSON.stringify(coordinates),
      { newPlaceIds: newPlaces.map(p => p.place_id), coordinates },
      parseInt(process.env.CACHE_TTL)
    );
}

const findNewWorker = async (
  { coordinates, placeIds },
  cb: Function
): Promise<void> => {
    try {
        const places: IGoogleSearchPlace[] = await scraper.getPlacesByCoordinates(
          coordinates
        );
        const newPlaces = places.filter(
          place => !placeIds.includes(place.place_id)
        );
        cb(null, { newPlaces, coordinates });
    } catch (e) {
        cb(e);
    }
};

const work = async (): Promise<void> => {
    await sequelizeManager.authenticate();
    await findNewPlaces();
};

work();
