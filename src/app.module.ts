import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ApplicationModule } from './application/application.module';
import { ConfigurationModule } from './common/config';
import { CustomConfigService } from './common/config/custom-config.service';
import { LoggerModule } from './common/logger';
import { OpenTelemetryModule } from './common/telemetry';
import { DomainModule } from './domain/domain.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthGuard } from './presentation/guards/auth.guard';
import { ErrorsInterceptor } from './presentation/interceptors';
import { EffectInterceptor } from './presentation/interceptors/effect.interceptor';
import { PresentationModule } from './presentation/presentation.module';
import { KafkaModule } from './common/kafka/kafka.module';

@Module({
  imports: [
    KafkaModule,
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
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
