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

@Module({
  imports: [InfrastructureModule],
  providers: [
    CartService,
    OrderService,
    PointService,
    ProductService,
    UserService,
    WalletService,
  ],
  exports: [
    CartService,
    OrderService,
    PointService,
    ProductService,
    UserService,
    WalletService,
  ],
})
export class DomainModule {}
