import axios, { AxiosInstance } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { Logger, LogLevel } from "../../logger/logger.js";

export interface IAxiosResponse {
    data: any;
    status: number;
}

export class HttpClient {

    private readonly axios: AxiosInstance;
    private readonly logger: Logger;

    constructor(proxyUrl?: string) {
        this.logger = new Logger({
            level: LogLevel.INFO,
            prefix: "HttpClient"
        });
        const validateStatus = () => true; // Don't throw on non-2xx responses
        if (proxyUrl) {
            const proxyAgent = new HttpsProxyAgent(proxyUrl);
            this.axios = axios.create({
                httpsAgent: proxyAgent,
                httpAgent: proxyAgent,
                validateStatus
            });
        } else {
            this.axios = axios.create({ validateStatus });
            this.logger.warn("Proxy not provided!");
        }
    }

    public async get(url: string): Promise<IAxiosResponse> {
        const response = await this.axios.get(url);
        const { status, data } = response;
        this.logger.debug(`GET ${url} ${status}`);
        return { data, status };
    }

    public async post(url: string, payload: any): Promise<IAxiosResponse> {
        const response = await this.axios.post(url, payload);
        const { status, data } = response;
        this.logger.debug(`POST ${url} ${status}`);
        return { data, status };
    }
}