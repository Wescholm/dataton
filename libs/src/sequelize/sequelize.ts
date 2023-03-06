import path from "path";
import * as dotenv from "dotenv"
dotenv.config({ path: path.join(__dirname, "..", ".env") });
import { Sequelize, Dialect } from 'sequelize';
import { GOOGLE_PLACES_TABLE } from "./sequelize.tables";
import { GOOGLE_PLACES_MODEL } from "./sequelize.models";

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
        const { dialect, host, port, database, username, password } = config;
        this.sequelize = new Sequelize({
            dialect: dialect as Dialect,
            host,
            port,
            database,
            username,
            password,
        });

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
