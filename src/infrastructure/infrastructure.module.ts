import { Module } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
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
} from './database/repositories';

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
export class InfrastructureModule {}
