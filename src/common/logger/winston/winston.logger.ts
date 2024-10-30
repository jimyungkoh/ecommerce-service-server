import { Inject, Injectable } from '@nestjs/common';
import * as winston from 'winston';
import {
  AppLogger,
  LogData,
  LogLevelName,
  LogLevels,
} from '../logger.interface';
export const WinstonLoggerTransportsKey = Symbol('WinstonLoggerTransports');

@Injectable()
export class WinstonLogger implements AppLogger {
  private logger: winston.Logger;
  constructor(
    @Inject(WinstonLoggerTransportsKey) transports: winston.transport[],
  ) {
    this.logger = winston.createLogger(this.getLoggerFormatOptions(transports));
  }

  private getLoggerFormatOptions(transports: winston.transport[]) {
    // 윈스턴 로그 레벨 설정
    const levels: Record<LogLevelName, number> = Object.fromEntries(
      Object.values(LogLevels).map((level) => [level.name, level.priority]),
    ) as Record<LogLevelName, number>;

    return {
      level: LogLevels.debug.name,
      levels: levels,
      format: winston.format.combine(
        // 타임스탬프 추가 및 날짜 포맷 지정
        winston.format.timestamp({
          format: () =>
            new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        }),
        // 에러는 스택 트레이스와 함께 로깅
        winston.format.errors({ stack: true }),
        // 커스텀 로그 필드 추가
        winston.format((info) => {
          // info가 Error 프로퍼티를 포함하는 경우
          if (info.error && info.error instanceof Error) {
            info.stack = info.error.stack;
            info.error = undefined;
          }

          info.label = `${info.sourceClass}`;

          return info;
        })(),
        // 커스텀 필드를 data 프로퍼티에 추가
        winston.format.metadata({
          key: 'data',
          fillExcept: ['timestamp', 'level', 'message'],
        }),
        // JSON 형식으로 로그 포맷팅
        winston.format.json(),
      ),
      transports: transports,
      exceptionHandlers: transports,
      rejectionHandlers: transports,
    };
  }

  public log(
    level: LogLevelName,
    message: string | Error,
    data?: LogData,
    profile?: string,
  ) {
    const logData = {
      level: level,
      message: message instanceof Error ? message.message : message,
      error: message instanceof Error ? message : undefined,
      ...data,
    };

    if (profile) {
      this.logger.profile(profile, logData);
    } else {
      this.logger.log(logData);
    }
  }

  public debug(message: string, data?: LogData, profile?: string) {
    this.log(LogLevels.debug.name, message, data, profile);
  }

  public info(message: string, data?: LogData, profile?: string) {
    this.log(LogLevels.info.name, message, data, profile);
  }

  public warn(message: string | Error, data?: LogData, profile?: string) {
    this.log(LogLevels.warn.name, message, data, profile);
  }

  public error(message: string | Error, data?: LogData, profile?: string) {
    this.log(LogLevels.error.name, message, data, profile);
  }

  public fatal(message: string | Error, data?: LogData, profile?: string) {
    this.log(LogLevels.fatal.name, message, data, profile);
  }

  public emergency(message: string | Error, data?: LogData, profile?: string) {
    this.log(LogLevels.emergency.name, message, data, profile);
  }

  public startProfile(id: string) {
    this.logger.profile(id);
  }
}
