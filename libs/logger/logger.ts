import chalk from "chalk";

export enum LogLevel {
    ERROR = "ERROR",
    WARN = "WARN",
    INFO = "INFO",
    DEBUG = "DEBUG",
}

export interface LoggerOptions {
    level: LogLevel;
    prefix?: string
}

export class Logger {
    private readonly level: LogLevel;
    private readonly prefix: string;

    constructor(options: LoggerOptions) {
        this.level = options.level;
        this.prefix = this.setPrefix(options.prefix);
    }

    log(level: LogLevel, message: string): void {
        if (this.shouldLog(level)) {
            const timestamp = new Date().toISOString();
            const coloredLevel = this.getColor(level)(level.toUpperCase());
            console.log(`${timestamp} [${coloredLevel}] ${this.prefix + message}`);
        }
    }

    error(message: string): void {
        this.log(LogLevel.ERROR, message);
    }

    warn(message: string): void {
        this.log(LogLevel.WARN, message);
    }

    info(message: string): void {
        this.log(LogLevel.INFO, message);
    }

    debug(message: string): void {
        this.log(LogLevel.DEBUG, message);
    }

    private shouldLog(level: LogLevel): boolean {
        return LogLevel[level] <= LogLevel[this.level];
    }

    private getColor(level: LogLevel): (message: string) => string {
        switch (level) {
            case LogLevel.ERROR:
                return chalk.red;
            case LogLevel.WARN:
                return chalk.yellow;
            case LogLevel.INFO:
                return chalk.green;
            case LogLevel.DEBUG:
                return chalk.blue;
            default:
                return chalk.white;
        }
    }

    private setPrefix(prefix?: string): string {
        return prefix ? `[${prefix}] ` : "";
    }
}
