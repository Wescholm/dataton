import * as dotenv from 'dotenv'
import { Logger, LogLevel } from "../libs";
import { getCurrentSpending } from "../aws";
dotenv.config();

const requiredEnvVars = [
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_SESSION_TOKEN"
]

const logger = new Logger({
    level: LogLevel.INFO,
    prefix: "Init"
})

const validateEnvVars = () => {
    requiredEnvVars.forEach(envVar => {
        if (!process.env[envVar]) {
            logger.error(`Missing required environment variable: ${envVar}`)
            process.exit(1);
        }
    })
}

const printBaseInfo = async () => {
    const currentSpending = await getCurrentSpending();
    logger.info("========= Base info =========")
    logger.info(`Current AWS spending: ${currentSpending}`);
    logger.info("=============================")
}

const init = () => {
    validateEnvVars();
}

export default init;