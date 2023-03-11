import path from "path";
import * as dotenv from "dotenv";
import * as minimist from "minimist";
dotenv.config({ path: path.join(__dirname, ".env") });
import { SequelizeManager } from "../../../../libs/src/sequelize/sequelize";
import { Logger } from "../../../../libs/src/logger/logger";
import { Cache, ICacheConfig } from "../../../../libs/src/cache";
import { ExplorePlaces } from "./explore";
import { GoogleMapsScraper, IGoogleMapsConfig } from "./google-maps-scraper";

const argv = minimist.default(process.argv.slice(2), {
  string: ["country", "week"],
  number: ["concurrency"],
  default: {
    concurrency: 10
  }
});

const WEEK = argv.week;
const COUNTRY = argv.country;
const CONCURRENCY = argv.concurrency;

const logger = new Logger({
  level: process.env.LOG_LEVEL,
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
};

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

const work = async (): Promise<void> => {
  logger.info(`Starting Google Maps Scraper for ${COUNTRY} week ${WEEK}`);
  await sequelizeManager.authenticate();
  const explorePlaces = new ExplorePlaces({
    scraper,
    cache,
    logger,
    sequelizeManager,
    country: COUNTRY,
    concurrency: CONCURRENCY
  });
  try {
    await explorePlaces.run();
  } catch (e) {
    logger.error(`Error while running Google Maps Scraper - ${e.message}`);
    process.exit(1);
  }
};

work();
