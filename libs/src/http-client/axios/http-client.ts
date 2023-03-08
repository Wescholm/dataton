import axios, { AxiosInstance } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { Logger, LogLevel } from "../../logger/logger";

export interface IAxiosResponse {
    data: any;
    status: number;
}

export interface IAxiosRequestPayload {
    url: string;
    payload?: any;
    maxRetries?: number;
}

export class HttpClient {

    private readonly axios: AxiosInstance;
    private readonly logger: Logger;

    constructor(proxyUrl?: string) {
        this.logger = new Logger({
            level: LogLevel[process.env.LOG_LEVEL],
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

    public async get(payload: IAxiosRequestPayload): Promise<IAxiosResponse> {
        return this.retryWrapper(payload, async () => {
            const response = await this.axios.get(payload.url);
            const { status, data } = response;
            this.logger.debug(`GET ${payload.url} ${status}`);
            return { data, status };
        });
    }

    public async post(payload: IAxiosRequestPayload): Promise<IAxiosResponse> {
        return this.retryWrapper(payload, async () => {
            const response = await this.axios.post(payload.url, payload.payload);
            const { status, data } = response;
            this.logger.debug(`POST ${payload.url} ${status}`);
            return { data, status };
        });
    }

    private async retryWrapper(
      payload: IAxiosRequestPayload,
      request: Function
    ): Promise<IAxiosResponse> {
        let retries = 0;
        while (true) {
            try {
                return await request(payload);
            } catch (err) {
                const message = `Request failed: ${err.message}.`;
                if (retries < payload.maxRetries) {
                    this.logger.error(`${message}. Retrying...`);
                    retries++;
                } else {
                    this.logger.error(`${message}. Max retries reached.`);
                    throw err;
                }
            }
        }
    }
}