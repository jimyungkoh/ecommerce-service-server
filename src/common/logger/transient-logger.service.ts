import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import { CustomConfigService } from '../config/custom-config.service';
import {
  AppLogger,
  AppLoggerToken,
  LogData,
  LogLevelName,
} from './logger.interface';

export const TransientLoggerServiceToken = Symbol('TransientLogger');

@Injectable({ scope: Scope.TRANSIENT })
export class TransientLoggerService implements AppLogger {
  private sourceClass: string;
  private context: string;
  private app: string;

  constructor(
    @Inject(AppLoggerToken)
    private readonly logger: AppLogger,
    @Inject(INQUIRER)
    private readonly parentClass: object,
    private readonly configService: CustomConfigService,
  ) {
    // 메타데이터 초기화
    this.sourceClass = this.parentClass.constructor.name;
    this.app = this.configService.get<string>('APP', 'ecommerce-service-app');
  }

  log(
    level: LogLevelName,
    message: string | Error,
    data?: LogData,
    profile?: string,
  ): void {
    this.logger.log(level, message, this.getLogData(data), profile);
  }
  debug(message: string, data?: LogData, profile?: string): void {
    this.logger.debug(message, this.getLogData(data), profile);
  }
  info(message: string, data?: LogData, profile?: string): void {
    this.logger.info(message, this.getLogData(data), profile);
  }
  warn(message: string | Error, data?: LogData, profile?: string): void {
    this.logger.warn(message, this.getLogData(data), profile);
  }
  error(message: string | Error, data?: LogData, profile?: string): void {
    this.logger.error(message, this.getLogData(data), profile);
  }
  fatal(message: string | Error, data?: LogData, profile?: string): void {
    this.logger.fatal(message, this.getLogData(data), profile);
  }
  emergency(message: string | Error, data?: LogData, profile?: string): void {
    this.logger.emergency(message, this.getLogData(data), profile);
  }

  private getLogData(data?: LogData): LogData {
    return {
      ...data,
      context: data?.context || this.context,
      app: data?.app || this.app,
      sourceClass: data?.sourceClass || this.sourceClass,
    };
  }

  startProfile(id: string): void {
    this.logger.startProfile(id);
  }
}
