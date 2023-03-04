import { HttpClient } from "../../../../libs/src/http-client/axios/http-client.js";

export enum SearchRankBy {
    prominence = "prominence",
    distance = "distance"
}

export interface IGoogleMapsConfig {
    apiKeys: string[];
    proxyUrl?: string;
}

export interface INearbySearchPayload {
    location: {
        lat: number;
        lng: number;
    };
    radius?: string;
    rankby: SearchRankBy;
}

export class GoogleMapsScraper {
    private readonly httpClient: HttpClient;
    private readonly apiKeys: string[];
    private DEFAULT_RADIUS: string = "5000";

    constructor(config: IGoogleMapsConfig) {
        this.httpClient = new HttpClient(config.proxyUrl);
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
        const url = new URL(process.env.GOOGLE_MAPS_API_URL + "/place/nearbysearch/json")
        url.searchParams.append("location", `${payload.location.lat},${payload.location.lng}`);
        url.searchParams.append("radius", payload.radius || this.DEFAULT_RADIUS);
        url.searchParams.append("rankby", payload.rankby);
        url.searchParams.append("key", this.getRandomApiKey());
        const { data } = await this.httpClient.get(url.toString());
        return data;
    }

    private readonly getRandomApiKey = (): string => {
        const randomIndex = Math.floor(Math.random() * this.apiKeys.length);
        return this.apiKeys[randomIndex];
    }
}