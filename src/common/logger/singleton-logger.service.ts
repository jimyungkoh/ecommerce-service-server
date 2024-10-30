import { ConsoleLogger, LoggerService } from '@nestjs/common';
import { AppLogger } from './logger.interface';

export class SingletonLoggerService
  extends ConsoleLogger
  implements LoggerService
{
  public constructor(private logger: AppLogger) {
    super();
  }

  public log(message: string, ...optionalParams: unknown[]) {
    return this.logger.info(message, this.getLogData(optionalParams));
  }

  public error(message: string, ...optionalParams: unknown[]) {
    return this.logger.error(message, this.getLogData(optionalParams));
  }

  public warn(message: string, ...optionalParams: unknown[]) {
    return this.logger.warn(message, this.getLogData(optionalParams));
  }

  public debug(message: string, ...optionalParams: unknown[]) {
    return this.logger.debug(message, this.getLogData(optionalParams));
  }

  public verbose(message: string, ...optionalParams: unknown[]) {
    return this.logger.info(message, this.getLogData(optionalParams));
  }

  private getLogData(...optionalParams: unknown[]) {
    const source = optionalParams[0];

    return {
      sourceClass: typeof source === 'string' ? source : undefined,
    };
  }
}
