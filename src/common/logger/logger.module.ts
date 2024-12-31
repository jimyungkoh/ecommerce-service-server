import { Global, Inject, MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigurationModule } from '../config';

import { ConfigService } from '@nestjs/config';
import { CustomConfigService } from '../config/custom-config.service';
import { AppLogger, AppLoggerToken } from './logger.interface';
import { SingletonLoggerService } from './singleton-logger.service';
import {
  TransientLoggerService,
  TransientLoggerServiceToken,
} from './transient-logger.service';
import { WinstonTransportsFactory } from './winston';
import {
  WinstonLogger,
  WinstonLoggerTransportsKey,
} from './winston/winston.logger';

@Global()
@Module({
  imports: [ConfigurationModule],
  providers: [
    {
      provide: AppLoggerToken,
      useClass: WinstonLogger,
    },
    {
      provide: TransientLoggerServiceToken,
      useClass: TransientLoggerService,
    },
    {
      provide: WinstonLoggerTransportsKey,
      useFactory: (configService: ConfigService) => {
        const transports = [];
        const production = configService.get('NODE_ENV') === 'production';
        if (production) {
          transports.push(WinstonTransportsFactory.fileTransports());
        }

        transports.push(WinstonTransportsFactory.consoleTransports());

        return transports;
      },
      inject: [ConfigService],
    },
    {
      provide: SingletonLoggerService,
      useFactory: (logger) => {
        return new SingletonLoggerService(logger);
      },
      inject: [AppLoggerToken],
    },
  ],
  exports: [TransientLoggerServiceToken, SingletonLoggerService],
})
export class LoggerModule {
  constructor(
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    private readonly configService: CustomConfigService,
  ) {}

  configure(consumer: MiddlewareConsumer): void {
    // consumer
    //   .apply(
    //     morgan(this.configService.isProduction ? 'combined' : 'dev', {
    //       stream: {
    //         write: (message: string) => {
    //           this.logger.debug(message, {
    //             sourceClass: 'HTTPRequestLogger',
    //           });
    //         },
    //       },
    //     }),
    //   )
    //   .forRoutes('*');
  }
}
