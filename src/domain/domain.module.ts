import { Module } from '@nestjs/common';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import {
  CartService,
  OrderService,
  PointService,
  ProductService,
  UserService,
  WalletService,
} from './services';
import { OrderEventListener } from './events/order-event.listener';
import { ProductEventListener } from './events/product-event.listener';

@Module({
  imports: [InfrastructureModule],
  providers: [
    OrderEventListener,
    ProductEventListener,
    CartService,
    OrderService,
    PointService,
    ProductService,
    UserService,
    WalletService,
  ],
  exports: [
    OrderEventListener,
    ProductEventListener,
    CartService,
    OrderService,
    PointService,
    ProductService,
    UserService,
    WalletService,
  ],
})
export class DomainModule {}
