import { Module } from '@nestjs/common';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import {
  CartService,
  OrderService,
  ProductService,
  UserService,
  WalletService,
} from './services';
import { PointService } from './services/point.service';
import {
  OrderUseCase,
  ProductUseCase,
  UserUseCase,
  WalletUseCase,
} from './use-cases';

@Module({
  imports: [InfrastructureModule],
  providers: [
    CartService,
    OrderService,
    PointService,
    ProductService,
    UserService,
    WalletService,
    CartService,
    OrderUseCase,
    ProductUseCase,
    UserUseCase,
    WalletUseCase,
  ],
  exports: [OrderUseCase, ProductUseCase, UserUseCase, WalletUseCase],
})
export class ApplicationModule {}
