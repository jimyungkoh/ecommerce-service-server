import * as path from 'path';
import * as winston from 'winston';
import * as winstonDaily from 'winston-daily-rotate-file';
import { LogLevels } from '../../logger.interface';

const LogColors = {
  orange: '\x1b[38;5;208m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  pink: '\x1b[38;5;206m',
} as const;

type LogColorType = (typeof LogColors)[keyof typeof LogColors];

const mapLogLevelColor = (level: string): LogColorType => {
  switch (level) {
    case LogLevels.debug.name:
      return LogColors.blue;
    case LogLevels.info.name:
      return LogColors.green;
    case LogLevels.warn.name:
      return LogColors.yellow;
    case LogLevels.error.name:
      return LogColors.red;
    case LogLevels.fatal.name:
      return LogColors.magenta;
    case LogLevels.emergency.name:
      return LogColors.pink;
    default:
      return LogColors.cyan;
  }
};

const colorize = (color: LogColorType, message: string): string => {
  return `${color}${message}\x1b[0m`;
};

const serializeProps = (
  props: NodeJS.Dict<unknown>,
): Record<string, unknown> => {
  const serializedProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'bigint') {
      serializedProps[key] = value.toString();
    } else if (typeof value === 'object' && value !== null) {
      serializedProps[key] = serializeProps(value as NodeJS.Dict<unknown>);
    } else {
      serializedProps[key] = value;
    }
  }

  return serializedProps;
};

export const WinstonTransportsFactory = {
  fileTransports: () =>
    new winstonDaily({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: path.join(process.cwd(), 'logs'),
      filename: `%DATE%.log`,
      maxFiles: 30,
      zippedArchive: true,
    }),
  consoleTransports: () =>
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.printf((log) => {
          const color = mapLogLevelColor(log.level);
          return `${colorize(LogColors.orange, log.timestamp)} ${colorize(
            color,
            log.level.toUpperCase(),
          )} ${
            log.data.sourceClass
              ? `${colorize(LogColors.cyan, `[${log.data.sourceClass}]`)}`
              : ''
          } ${colorize(
            LogColors.orange,
            log.message + (log.data.error ? ` - ${log.data.error}` : ''),
          )}${
            log.data.durationMs !== undefined
              ? colorize(color, ' +' + log.data.durationMs + 'ms')
              : ''
          }${log.data.stack ? colorize(color, `\n  - ${log.data.stack}`) : ''}${
            log.data.props
              ? `\n  - Props: ${JSON.stringify(
                  serializeProps(log.data.props),
                  null,
                  2,
                )}`
              : ''
          }`;
        }),
      ),
    }),
};
