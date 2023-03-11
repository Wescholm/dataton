import path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "..", ".env") });
import * as pg from "pg";
import { Sequelize } from "sequelize";
import { GOOGLE_PLACES_TABLE } from "./sequelize.tables";
import { GOOGLE_PLACES_MODEL } from "./sequelize.models";
import * as process from "process";
import { LOG_LEVEL } from "../logger/logger";

export interface ISequelizeConfig {
  dialect: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export class SequelizeManager {
  private sequelize: Sequelize;

  constructor(config: ISequelizeConfig) {
    const { host, port, database, username, password } = config;
    const shouldLog = LOG_LEVEL[process.env.LOG_LEVEL] == LOG_LEVEL.DEBUG;
    this.sequelize = new Sequelize(
      `postgres://${username}:${password}@${host}:${port}/${database}`,
      {
        dialectModule: pg,
        logging: shouldLog
      }
    );
    this.sequelize.define(GOOGLE_PLACES_TABLE, GOOGLE_PLACES_MODEL);
  }

  public async authenticate(): Promise<void> {
    await this.sequelize.authenticate();
  }

  public async close(): Promise<void> {
    await this.sequelize.close();
  }

  public getModel<T>(name: string) {
    return this.sequelize.model(name);
  }
}
