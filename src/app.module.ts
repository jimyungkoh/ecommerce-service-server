import { Module } from '@nestjs/common';
import { ApplicationModule } from './application/application.module';
import { LoggerModule } from './common/logger/logger.module';
import { DomainModule } from './domain/domain.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { PresentationModule } from './presentation/presentation.module';

@Module({
  imports: [
    LoggerModule,
    PresentationModule,
    ApplicationModule,
    DomainModule,
    InfrastructureModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
