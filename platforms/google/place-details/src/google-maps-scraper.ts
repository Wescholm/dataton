import fs from "fs";
import path from "path";
import * as readline from "readline";
import { HttpClient } from "../../../../libs/src/http-client";
import { SequelizeManager } from "../../../../libs/src/sequelize/sequelize";
import { IGoogleSearchPlace } from "../../../../interfaces";

export enum SearchRankBy {
  prominence = "prominence",
  distance = "distance"
}

export interface IGoogleMapsConfig {
  apiKeys: string[];
  proxyUrl?: string;
  sequelizeManager: SequelizeManager;
  maxRetries?: number;
}

export interface IAddPlacePayload {
  place_id: string;
  country: string;
}

export interface INearbySearchPayload {
  location: {
    lat: number;
    lng: number;
  };
  radius?: string;
  rankby: SearchRankBy;
  nextPageToken?: string;
}

interface INearbySearchResponse {
  html_attributions: string[];
  next_page_token: string;
  results: IGoogleSearchPlace[];
  status: string;
}

export class GoogleMapsScraper {
  private readonly httpClient: HttpClient;
  private readonly sequelizeManager: SequelizeManager;
  private readonly apiKeys: string[];
  private readonly maxRetries: number;
  private DEFAULT_RADIUS = "50000";

  constructor(config: IGoogleMapsConfig) {
    this.httpClient = new HttpClient(config.proxyUrl);
    this.sequelizeManager = config.sequelizeManager;
    this.maxRetries = config.maxRetries || 1;
    this.apiKeys = config.apiKeys;
  }

  public async getPlaceDetails(placeId: string): Promise<any> {
    const url = new URL(
      process.env.GOOGLE_MAPS_API_URL + "/place/details/json"
    );
    url.searchParams.append("placeid", placeId);
    url.searchParams.append("key", this.getRandomApiKey());
    const { data } = await this.httpClient.get({
      url: url.toString(),
      maxRetries: this.maxRetries
    });
    return data;
  }

  public async nearbySearch(
    payload: INearbySearchPayload
  ): Promise<INearbySearchResponse> {
    const { location, rankby, radius, nextPageToken } = payload;
    const url = new URL(
      process.env.GOOGLE_MAPS_API_URL + "/place/nearbysearch/json"
    );
    url.searchParams.append("location", `${location.lat},${location.lng}`);
    url.searchParams.append("rankby", rankby);
    url.searchParams.append("key", this.getRandomApiKey());
    if (rankby === SearchRankBy.prominence) {
      url.searchParams.append("radius", radius || this.DEFAULT_RADIUS);
    }
    if (nextPageToken) {
      url.searchParams.append("pagetoken", nextPageToken);
    }
    const { data } = await this.httpClient.get({
      url: url.toString(),
      maxRetries: this.maxRetries
    });
    return data;
  }

  public async *streamCoordinates(): AsyncGenerator<number[]> {
    const pathToFile = path.join(__dirname, "coordinates.txt"); // TODO: Move coord path to config
    const lineReader = readline.createInterface({
      input: fs.createReadStream(pathToFile)
    });
    for await (const line of lineReader) {
      yield eval(line);
    }
  }

  public getCoordinatesLength(): number {
    const pathToFile = path.join(__dirname, "coordinates.txt");
    const fileContent = fs.readFileSync(pathToFile, "utf8");
    const lines = fileContent.split("\n");
    return lines.length;
  }

  private readonly getRandomApiKey = (): string => {
    const randomIndex = Math.floor(Math.random() * this.apiKeys.length);
    return this.apiKeys[randomIndex];
  };

  public async getPlacesByCoordinates(
    coordinates: number[]
  ): Promise<IGoogleSearchPlace[]> {
    const places: IGoogleSearchPlace[] = [];
    const [lat, lng] = coordinates;
    for (const rankBy of [SearchRankBy.prominence, SearchRankBy.distance]) {
      const payload: INearbySearchPayload = {
        location: { lat, lng },
        rankby: rankBy
      };
      do {
        const { results, next_page_token }: INearbySearchResponse =
          await this.nearbySearch(payload);
        payload.nextPageToken = next_page_token;
        places.push(...results);
      } while (payload.nextPageToken);
    }
    return places;
  }

  public async getAllPlaceIds(): Promise<any[]> {
    const GooglePlaces = this.sequelizeManager.getModel(
      process.env.PSQL_TABLE_NAME
    );
    const places = await GooglePlaces.findAll();
    return places.map(p => p.dataValues.placeId);
  }

  public async getPlacesByIds(ids: string[]): Promise<string[]> {
    const GooglePlaces = this.sequelizeManager.getModel(
      process.env.PSQL_TABLE_NAME
    );
    const places = await GooglePlaces.findAll({ where: { placeId: ids } });
    return places.map(p => p.dataValues);
  }

  public async addPlacesToDb(
    places: Partial<IAddPlacePayload>[]
  ): Promise<void> {
    const GooglePlaces = this.sequelizeManager.getModel(
      process.env.PSQL_TABLE_NAME
    );
    await GooglePlaces.bulkCreate(places, { ignoreDuplicates: true });
  }

  public async isPlaceExists(id: string): Promise<boolean> {
    const GooglePlaces = this.sequelizeManager.getModel(
      process.env.PSQL_TABLE_NAME
    );
    const place = await GooglePlaces.findOne({ where: { id } });
    return !!place;
  }
}
