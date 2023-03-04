import path from "path";
import * as dotenv from "dotenv"
dotenv.config({ path: path.join(__dirname, ".env") });
import { GoogleMapsScraper, IGoogleMapsConfig } from "./google-maps-scraper.js";
import { Logger, LogLevel } from "../../../../libs/src/logger/logger.js";
import { LocalDb } from "../../../../libs/src/local-db/db.js";

const logger = new Logger({
    level: LogLevel.INFO,
    prefix: "GoogleMapsScraper"
});

const config: IGoogleMapsConfig = {
    apiKeys: [
        "AIzaSyDZbWNBK81yJVvpc5wRfCLwPyLYsGpwRbQ",
        "AIzaSyAJV0pH9dpVwdNZeLajIGsIpjcPu3tVgAE"
    ],
    proxyUrl: process.env.PROXY_URL
}

const scraper = new GoogleMapsScraper(config);
const localDb = new LocalDb({ path: process.env.LOCAL_DB_PATH });

const work = async () => {
    // Code...
}

work();