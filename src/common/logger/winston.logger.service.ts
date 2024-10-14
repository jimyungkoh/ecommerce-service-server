import { Injectable, LoggerService } from '@nestjs/common';
import * as path from 'path';
import * as winston from 'winston';
import * as winstonDaily from 'winston-daily-rotate-file';

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const logDir = path.join(process.cwd(), 'logs');

    const dailyOptions = {
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir,
      filename: `%DATE%-info.log`,
      maxFiles: 30,
      zippedArchive: true,
    };

    // UTC 시간을 사용하는 타임스탬프 포맷 정의
    const timezoned = () => {
      return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    };

    // 공통 로그 포맷 정의
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: timezoned }),
      winston.format.printf(({ timestamp, level, message, context }) => {
        return `${timestamp} [${context}] ${level}: ${message}`;
      }),
    );

    this.logger = winston.createLogger({
      format: logFormat,
      transports: [
        // 일별 로그 파일 생성
        new winstonDaily(dailyOptions),

        // 에러 로그만 별도 파일로 저장
        new winstonDaily({
          ...dailyOptions,
          filename: '%DATE%-error.log',
          level: 'error',
        }),

        // 콘솔 출력
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            logFormat,
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(`${message} - ${trace}`, { context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
