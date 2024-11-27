import { Module } from '@nestjs/common';
import { OutboxEventRepository } from './repositories/outbox-event.repository';
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
    OutboxEventRepository,
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
    OutboxEventRepository,
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
