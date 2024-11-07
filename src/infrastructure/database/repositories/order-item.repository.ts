import { Injectable } from '@nestjs/common';
import { OrderItem, Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { OrderItemModel } from 'src/domain/models';
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
    const createPromise = Effect.tryPromise(() =>
      prisma.orderItem.create({ data }),
    );

    return pipe(createPromise, Effect.map(OrderItemModel.from));
  }

  update(
    id: number,
    data: Prisma.OrderItemUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const updatePromise = Effect.tryPromise(() =>
      prisma.orderItem.update({ where: { id }, data }),
    );

    return pipe(updatePromise, Effect.map(OrderItemModel.from));
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const deletePromise = Effect.tryPromise(() =>
      prisma.orderItem.delete({ where: { id } }),
    );

    return pipe(
      deletePromise,
      Effect.map(() => undefined),
    );
  }

  findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;

    const orderItemPromise = Effect.tryPromise(() =>
      prisma.orderItem.findUnique({ where: { id } }),
    );

    return pipe(
      orderItemPromise,
      Effect.map((orderItem) =>
        orderItem ? OrderItemModel.from(orderItem) : null,
      ),
    );
  }

  findByOrderId(
    orderId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const orderItemsPromise = Effect.tryPromise(() =>
      prisma.orderItem.findMany({ where: { orderId } }),
    );

    return pipe(
      orderItemsPromise,
      Effect.map((orderItems) => orderItems.map(OrderItemModel.from)),
    );
  }

  getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const orderItemPromise = Effect.tryPromise(() =>
      prisma.orderItem.findUniqueOrThrow({ where: { id } }),
    );

    return pipe(orderItemPromise, Effect.map(OrderItemModel.from));
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const orderItemsPromise = Effect.tryPromise(() =>
      prisma.orderItem.findMany(),
    );

    return pipe(
      orderItemsPromise,
      Effect.map((orderItems) => orderItems.map(OrderItemModel.from)),
    );
  }
}
