import fs from "fs";
import path from "path";
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

export class GoogleMapsScraper {
    private readonly httpClient: HttpClient;
    private readonly sequelizeManager: SequelizeManager;
    private readonly apiKeys: string[];
    private DEFAULT_RADIUS: string = "5000";

    constructor(config: IGoogleMapsConfig) {
        this.httpClient = new HttpClient(config.proxyUrl);
        this.sequelizeManager = config.sequelizeManager;
        this.apiKeys = config.apiKeys;
    }

    public async getPlaceDetails(placeId: string): Promise<any> {
        const url = new URL(process.env.GOOGLE_MAPS_API_URL + "/place/details/json");
        url.searchParams.append("placeid", placeId);
        url.searchParams.append("key", this.getRandomApiKey());
        const { data } = await this.httpClient.get(url.toString());
        return data;
    }

    public async nearbySearch(payload: INearbySearchPayload): Promise<any> {
        const { location, rankby, radius, nextPageToken } = payload;
        const url = new URL(process.env.GOOGLE_MAPS_API_URL + "/place/nearbysearch/json")
        url.searchParams.append("location", `${location.lat},${location.lng}`);
        url.searchParams.append("rankby", rankby);
        url.searchParams.append("key", this.getRandomApiKey());
        if (rankby === SearchRankBy.prominence) {
            url.searchParams.append("radius", radius || this.DEFAULT_RADIUS);
        }
        if (nextPageToken) {
            url.searchParams.append("pagetoken", nextPageToken);
        }
        const { data } = await this.httpClient.get(url.toString());
        return data;
    }

    public async getCoordinates(): Promise<number[][]> {
        const _path = path.join(__dirname, "coordinates.json")
        const coordinates = fs.readFileSync(_path, "utf8");
        const json = JSON.parse(coordinates);
        return json.map(c => eval(c));
    }

    private readonly getRandomApiKey = (): string => {
        const randomIndex = Math.floor(Math.random() * this.apiKeys.length);
        return this.apiKeys[randomIndex];
    }

    public async getPlacesByCoordinates(coordinates: number[]): Promise<any[]> {
        const places: IGoogleSearchPlace[] = [];
        const [lat, lng] = coordinates;
        for (const rankBy of [SearchRankBy.prominence, SearchRankBy.distance]) {
            const payload: INearbySearchPayload = {
                location: { lat, lng },
                rankby: rankBy
            }
            do {
                const { results, next_page_token } = await this.nearbySearch(payload);
                payload.nextPageToken = next_page_token;
                places.push(...results);
            } while (payload.nextPageToken)
        }
        return places;
    }

    public async getAllPlaceIds(): Promise<any[]> {
        const GooglePlaces = this.sequelizeManager.getModel(process.env.PSQL_TABLE_NAME);
        const places = await GooglePlaces.findAll();
        return places.map(p => p.dataValues.id);
    }

    public async addPlace({ id, country }): Promise<void> {
        const GooglePlaces = this.sequelizeManager.getModel(process.env.PSQL_TABLE_NAME);
        await GooglePlaces.create({ id, country });
    }

    public async isPlaceExists(id: string): Promise<boolean> {
        const GooglePlaces = this.sequelizeManager.getModel(process.env.PSQL_TABLE_NAME);
        const place = await GooglePlaces.findOne({ where: { id } });
        return !!place;
    }
}