import { Module } from '@nestjs/common';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { EventsModule } from './events';
import {
  CartService,
  OrderService,
  OutboxPollingService,
  PointService,
  ProductService,
  UserService,
  WalletService,
} from './services';

@Module({
  imports: [InfrastructureModule, EventsModule],
  providers: [
    OutboxPollingService,
    CartService,
    OrderService,
    PointService,
    ProductService,
    UserService,
    WalletService,
  ],
  exports: [
    OutboxPollingService,
    CartService,
    OrderService,
    PointService,
    ProductService,
    UserService,
    WalletService,
  ],
})
export class DomainModule {}
