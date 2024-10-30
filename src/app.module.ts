import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ApplicationModule } from './application/application.module';
import { ConfigurationModule } from './common/config';
import { CustomConfigService } from './common/config/custom-config.service';
import { LoggerModule } from './common/logger';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ErrorsInterceptor } from './presentation/interceptors';
import { PresentationModule } from './presentation/presentation.module';

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule,
    PresentationModule,
    ApplicationModule,
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
  ],
})
export class AppModule {}
