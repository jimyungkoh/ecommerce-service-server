import { Injectable } from '@nestjs/common';
import { Order, OrderStatus, Prisma } from '@prisma/client';
import { Effect } from 'effect';
import { OrderModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class OrderRepository implements BaseRepository<Order, OrderModel> {
  constructor(private readonly prismaClient: PrismaService) {}

  create(
    data: Prisma.OrderCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const createPromise = prisma.order.create({ data });

    return Effect.promise(() => createPromise).pipe(
      Effect.map(OrderModel.from),
    );
  }

  update(
    id: number,
    data: Prisma.OrderUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderModel, Error> {
    const prisma = transaction ?? this.prismaClient;

    const updatePromise = prisma.order.update({
      where: { id },
      data,
    });

    return Effect.promise(() => updatePromise).pipe(
      Effect.map(OrderModel.from),
    );
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const deletePromise = prisma.order.delete({ where: { id } });

    return Effect.promise(() => deletePromise);
  }

  findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderModel | null> {
    const prisma = transaction ?? this.prismaClient;

    const orderPromise = prisma.order.findUnique({ where: { id } });

    return Effect.promise(() => orderPromise).pipe(
      Effect.map((order) => (order ? OrderModel.from(order) : null)),
    );
  }

  getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const orderPromise = prisma.order.findUniqueOrThrow({ where: { id } });

    return Effect.promise(() => orderPromise).pipe(Effect.map(OrderModel.from));
  }

  findAll(transaction?: Prisma.TransactionClient): Effect.Effect<OrderModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const ordersPromise = prisma.order.findMany();

    return Effect.promise(() => ordersPromise).pipe(
      Effect.map((orders) => orders.map(OrderModel.from)),
    );
  }

  findByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const ordersPromise = prisma.order.findMany({ where: { userId } });

    return Effect.promise(() => ordersPromise).pipe(
      Effect.map((orders) => orders.map(OrderModel.from)),
    );
  }

  findByUserIdAndOrderStatus(
    userId: number,
    status: OrderStatus,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const ordersPromise = prisma.order.findMany({ where: { userId, status } });

    return Effect.promise(() => ordersPromise).pipe(
      Effect.map((orders) => orders.map(OrderModel.from)),
    );
  }
}
