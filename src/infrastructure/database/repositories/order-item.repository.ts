import { Injectable } from '@nestjs/common';
import { OrderItem, Prisma } from '@prisma/client';
import { Effect } from 'effect';
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
    const createPromise = prisma.orderItem.create({ data });

    return Effect.promise(() => createPromise).pipe(
      Effect.map(OrderItemModel.from),
    );
  }

  update(
    id: number,
    data: Prisma.OrderItemUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const updatePromise = prisma.orderItem.update({ where: { id }, data });

    return Effect.promise(() => updatePromise).pipe(
      Effect.map(OrderItemModel.from),
    );
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const deletePromise = prisma.orderItem.delete({ where: { id } });

    return Effect.promise(() => deletePromise);
  }

  findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;

    const orderItemPromise = prisma.orderItem.findUnique({ where: { id } });

    return Effect.promise(() => orderItemPromise).pipe(
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
    const orderItemsPromise = prisma.orderItem.findMany({ where: { orderId } });

    return Effect.promise(() => orderItemsPromise).pipe(
      Effect.map((orderItems) => orderItems.map(OrderItemModel.from)),
    );
  }

  getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const orderItemPromise = prisma.orderItem.findUniqueOrThrow({
      where: { id },
    });

    return Effect.promise(() => orderItemPromise).pipe(
      Effect.map(OrderItemModel.from),
    );
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const orderItemsPromise = prisma.orderItem.findMany();

    return Effect.promise(() => orderItemsPromise).pipe(
      Effect.map((orderItems) => orderItems.map(OrderItemModel.from)),
    );
  }
}
