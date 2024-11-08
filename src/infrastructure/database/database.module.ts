import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  CartItemRepository,
  CartRepository,
  OrderItemRepository,
  OrderRepository,
  PointRepository,
  PopularProductRepository,
  ProductRepository,
  ProductStockRepository,
  UserRepository,
  WalletRepository,
} from './repositories';

@Module({
  providers: [
    PrismaService,
    CartItemRepository,
    CartRepository,
    OrderItemRepository,
    OrderRepository,
    PointRepository,
    PopularProductRepository,
    ProductStockRepository,
    ProductRepository,
    UserRepository,
    WalletRepository,
  ],
  exports: [
    PrismaService,
    CartItemRepository,
    CartRepository,
    OrderItemRepository,
    OrderRepository,
    PointRepository,
    PopularProductRepository,
    ProductStockRepository,
    ProductRepository,
    UserRepository,
    WalletRepository,
  ],
})
export class DatabaseModule {}
