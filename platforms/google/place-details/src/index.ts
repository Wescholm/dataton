import path from "path";
import * as dotenv from "dotenv"
import * as fastq from "fastq";
dotenv.config({ path: path.join(__dirname, ".env") });
import { GoogleMapsScraper, IGoogleMapsConfig } from "./google-maps-scraper.js";
import { SequelizeManager } from "../../../../libs/src/sequelize/sequelize";
import { Logger, LogLevel } from "../../../../libs/src/logger/logger.js";
import { IGoogleSearchPlace } from "../../../../interfaces";

const logger = new Logger({
    level: LogLevel.INFO,
    prefix: "GoogleMapsScraper"
});

const sequelizeConfig = {
    dialect: process.env.PSQL_DIALECT,
    host: process.env.PSQL_HOST,
    port: parseInt(process.env.PSQL_PORT),
    database: process.env.PSQL_DATABASE,
    username: process.env.PSQL_USERNAME,
    password: process.env.PSQL_PASSWORD
}

const sequelizeManager = new SequelizeManager(sequelizeConfig);
const config: IGoogleMapsConfig = {
    apiKeys: [
        "AIzaSyDZbWNBK81yJVvpc5wRfCLwPyLYsGpwRbQ",
        "AIzaSyAJV0pH9dpVwdNZeLajIGsIpjcPu3tVgAE"
    ],
    proxyUrl: process.env.PROXY_URL,
    sequelizeManager
}

const scraper = new GoogleMapsScraper(config);

const loadCoordinates = async () => {
    const coordinates = await scraper.getCoordinates();
    logger.info(`Loaded ${coordinates.length} coordinates`);
    return coordinates;
}

const fineNewPlaces = async (): Promise<void> => {
    const placeIds = await scraper.getAllPlaceIds();
    const queue = fastq(findNewWorker, 1);
    for (const coordinates of await loadCoordinates()) {
        queue.push(coordinates, (err, places) => {
            if (err) {
                throw err;
            }
            logger.info(`Found ${places.length} places`);
        });
    }
}

const saveNewPlaces = async (places: IGoogleSearchPlace[]): Promise<void> => {
}

const findNewWorker = async (coordinates: number[]): Promise<void> => {
    const places = await scraper.getPlacesByCoordinates(coordinates);
}

const work = async (): Promise<void> => {
    await sequelizeManager.authenticate();
    await fineNewPlaces();
}


work();