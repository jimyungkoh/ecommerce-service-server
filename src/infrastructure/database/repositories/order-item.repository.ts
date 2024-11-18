import { Injectable } from '@nestjs/common';
import { OrderItem, Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { OrderItemModel } from 'src/domain/models/order/order-item.model';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class OrderItemRepository
  implements BaseRepository<OrderItem, OrderItemModel>
{
  constructor(private readonly prismaClient: PrismaService) {}

  create(
    data: Prisma.OrderItemCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const createOrderItem = Effect.tryPromise(() =>
      prisma.orderItem.create({ data }),
    );

    return pipe(createOrderItem, Effect.map(OrderItemModel.from));
  }

  update(
    id: number,
    data: Prisma.OrderItemUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const updateOrderItem = Effect.tryPromise(() =>
      prisma.orderItem.update({ where: { id }, data }),
    );

    return pipe(updateOrderItem, Effect.map(OrderItemModel.from));
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const deleteOrderItem = Effect.tryPromise(() =>
      prisma.orderItem.delete({ where: { id } }),
    );

    return pipe(
      deleteOrderItem,
      Effect.map(() => undefined),
    );
  }

  findOneBy(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;

    const findOrderItem = Effect.tryPromise(() =>
      prisma.orderItem.findUnique({ where: { id } }),
    );

    return pipe(
      findOrderItem,
      Effect.map((orderItem) =>
        orderItem ? OrderItemModel.from(orderItem) : null,
      ),
    );
  }

  findManyBy(
    orderId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const findOrderItems = Effect.tryPromise(() =>
      prisma.orderItem.findMany({ where: { orderId } }),
    );

    return pipe(
      findOrderItems,
      Effect.map((orderItems) => orderItems.map(OrderItemModel.from)),
    );
  }

  getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const getOrderItem = Effect.tryPromise(() =>
      prisma.orderItem.findUniqueOrThrow({ where: { id } }),
    );

    return pipe(getOrderItem, Effect.map(OrderItemModel.from));
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const findAllItems = Effect.tryPromise(() => prisma.orderItem.findMany());

    return pipe(
      findAllItems,
      Effect.map((orderItems) => orderItems.map(OrderItemModel.from)),
    );
  }
}
