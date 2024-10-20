import { Module } from '@nestjs/common';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import {
  OrderFacade,
  ProductFacade,
  UserFacade,
  WalletFacade,
} from './facades';
import {
  CartService,
  OrderService,
  ProductService,
  UserService,
  WalletService,
} from './services';
import { PointService } from './services/point.service';

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
    OrderFacade,
    ProductFacade,
    UserFacade,
    WalletFacade,
  ],
  exports: [OrderFacade, ProductFacade, UserFacade, WalletFacade],
})
export class ApplicationModule {}
