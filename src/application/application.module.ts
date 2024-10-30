import { Module } from '@nestjs/common';
import { DomainModule } from 'src/domain/domain.module';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import {
  OrderFacade,
  ProductFacade,
  UserFacade,
  WalletFacade,
} from './facades';

@Module({
  imports: [InfrastructureModule, DomainModule],
  providers: [OrderFacade, ProductFacade, UserFacade, WalletFacade],
  exports: [OrderFacade, ProductFacade, UserFacade, WalletFacade],
})
export class ApplicationModule {}
