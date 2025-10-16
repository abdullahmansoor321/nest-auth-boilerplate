import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

const { combine, timestamp, colorize, json } = winston.format;

export function createWinstonOptions() {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const consoleFormat = isDevelopment
    ? combine(colorize(), timestamp(), nestWinstonModuleUtilities.format.nestLike())
    : combine(timestamp(), json());

  return {
    transports: [new winston.transports.Console({ format: consoleFormat })],
  };
}
