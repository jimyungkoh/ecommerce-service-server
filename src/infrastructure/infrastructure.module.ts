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
import { OrderProducer, UserProducer } from './producer';

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
    OrderProducer,
    UserProducer,
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
    OrderProducer,
    UserProducer,
  ],
})
export class InfrastructureModule {}
