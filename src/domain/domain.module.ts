import { Module } from '@nestjs/common';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import {
  OrderEventListener,
  ProductEventListener,
  UserEventListener,
} from './events';
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
  imports: [InfrastructureModule],
  providers: [
    OutboxPollingService,
    OrderEventListener,
    ProductEventListener,
    UserEventListener,
    CartService,
    OrderService,
    PointService,
    ProductService,
    UserService,
    WalletService,
  ],
  exports: [
    OutboxPollingService,
    OrderEventListener,
    ProductEventListener,
    UserEventListener,
    CartService,
    OrderService,
    PointService,
    ProductService,
    UserService,
    WalletService,
  ],
})
export class DomainModule {}
