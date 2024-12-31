import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MurLockModule } from 'murlock';
import { ApplicationModule } from './application/application.module';
import { ConfigurationModule } from './common/config';
import { CustomConfigService } from './common/config/custom-config.service';
import { KafkaModule } from './common/kafka/kafka.module';
import { LoggerModule } from './common/logger';
import { OpenTelemetryModule } from './common/telemetry';
import { DomainModule } from './domain/domain.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthGuard } from './presentation/guards/auth.guard';
import { ErrorsInterceptor } from './presentation/interceptors';
import { EffectInterceptor } from './presentation/interceptors/effect.interceptor';
import { PresentationModule } from './presentation/presentation.module';

@Module({
  imports: [
    KafkaModule,
    MurLockModule.forRootAsync({
      imports: [ConfigurationModule],
      useFactory: async (configService: CustomConfigService) => ({
        redisOptions: {
          url: `redis://${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`,
        },
        logLevel: 'debug',
        maxAttempts: 3,
        wait: 1_000,
      }),
      inject: [CustomConfigService],
    }),
    OpenTelemetryModule,
    ConfigurationModule,
    LoggerModule,
    PresentationModule,
    ApplicationModule,
    DomainModule,
    InfrastructureModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: (customConfigService: CustomConfigService) => ({
        secret: customConfigService.jwtSecret,
        signOptions: { expiresIn: '60s' },
      }),
      inject: [CustomConfigService],
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: EffectInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
