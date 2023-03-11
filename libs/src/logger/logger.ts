import chalk from "chalk";
import { getKeyByValue } from "../utils";

export const LOG_LEVEL = {
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4
};

export interface LoggerOptions {
  level: string;
  prefix?: string;
}

export class Logger {
  private readonly level: string;
  private readonly prefix: string;

  constructor(options: LoggerOptions) {
    this.level = options.level.toUpperCase();
    this.prefix = this.setPrefix(options.prefix);
  }

  log(level: number, message: string): void {
    const logLevel: string = getKeyByValue(LOG_LEVEL, level);
    if (this.shouldLog(level)) {
      const timestamp = new Date().toISOString();
      const coloredLevel = this.getColor(level)(logLevel);
      console.log(`${timestamp} [${coloredLevel}] ${this.prefix + message}`);
    }
  }

  error(message: string): void {
    this.log(LOG_LEVEL.ERROR, message);
  }

  warn(message: string): void {
    this.log(LOG_LEVEL.WARN, message);
  }

  info(message: string): void {
    this.log(LOG_LEVEL.INFO, message);
  }

  debug(message: string): void {
    this.log(LOG_LEVEL.DEBUG, message);
  }

  private shouldLog(level: number): boolean {
    return level <= LOG_LEVEL[this.level];
  }

  private getColor(level: number): (message: string) => string {
    switch (level) {
      case LOG_LEVEL.ERROR:
        return chalk.red;
      case LOG_LEVEL.WARN:
        return chalk.yellow;
      case LOG_LEVEL.INFO:
        return chalk.green;
      case LOG_LEVEL.DEBUG:
        return chalk.blue;
      default:
        return chalk.white;
    }
  }

  private setPrefix(prefix?: string): string {
    return prefix ? `[${prefix}] ` : "";
  }
}
