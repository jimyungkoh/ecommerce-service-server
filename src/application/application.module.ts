import { Module } from '@nestjs/common';
import { DomainModule } from 'src/domain/domain.module';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { OrderFacade, ProductFacade, UserFacade } from './facades';

@Module({
  imports: [InfrastructureModule, DomainModule],
  providers: [OrderFacade, ProductFacade, UserFacade],
  exports: [OrderFacade, ProductFacade, UserFacade],
})
export class ApplicationModule {}
