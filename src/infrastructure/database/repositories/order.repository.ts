import { Order, OrderStatus, Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import { AppNotFoundException } from 'src/domain/exceptions';
import { OrderModel } from 'src/domain/models';
import { Infrastructure } from '../../../common/decorators';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Infrastructure()
export class OrderRepository implements BaseRepository<Order, OrderModel> {
  constructor(private readonly prismaService: PrismaService) {}

  create(
    data: Prisma.OrderCreateInput,
    select: Prisma.OrderSelect = {
      id: true,
      userId: true,
      status: true,
    },
    tx?: Prisma.TransactionClient,
  ): Effect.Effect<OrderModel, Error> {
    const prisma = tx ?? this.prismaService;

    const createPromise = Effect.tryPromise({
      try: () => prisma.order.create({ data, select }),
      catch: (e) => {
        throw e;
      },
    });

    return pipe(createPromise, Effect.map(OrderModel.from));
  }

  update(
    id: number,
    data: Prisma.OrderUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderModel, Error> {
    const prisma = transaction ?? this.prismaService;

    const updatePromise = Effect.tryPromise(() =>
      prisma.order.update({ where: { id }, data }),
    );

    return pipe(updatePromise, Effect.map(OrderModel.from));
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaService;
    const deletePromise = Effect.tryPromise(() =>
      prisma.order.delete({ where: { id } }),
    );

    return pipe(
      deletePromise,
      Effect.map(() => void 0),
    );
  }

  findOneBy(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderModel | null, Error> {
    const prisma = transaction ?? this.prismaService;

    const orderPromise = Effect.tryPromise(() =>
      prisma.order.findUnique({ where: { id } }),
    );

    return pipe(
      orderPromise,
      Effect.map((order) => (order ? OrderModel.from(order) : null)),
    );
  }

  getById(id: number, transaction?: Prisma.TransactionClient) {
    const prisma = transaction ?? this.prismaService;
    const orderPromise = Effect.tryPromise(() =>
      prisma.order.findUniqueOrThrow({ where: { id } }),
    );

    return pipe(
      orderPromise,
      Effect.map(OrderModel.from),
      Effect.catchAll(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.ORDER_NOT_FOUND)),
      ),
    );
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderModel[], Error> {
    const prisma = transaction ?? this.prismaService;
    const ordersPromise = Effect.tryPromise(() => prisma.order.findMany());

    return pipe(
      ordersPromise,
      Effect.map((orders) => orders.map(OrderModel.from)),
    );
  }

  findByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderModel[], Error> {
    const prisma = transaction ?? this.prismaService;
    const ordersPromise = Effect.tryPromise(() =>
      prisma.order.findMany({ where: { userId } }),
    );

    return pipe(
      ordersPromise,
      Effect.map((orders) => orders.map(OrderModel.from)),
    );
  }

  findByUserIdAndOrderStatus(
    userId: number,
    status: OrderStatus,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderModel[], Error> {
    const prisma = transaction ?? this.prismaService;
    const ordersPromise = Effect.tryPromise(() =>
      prisma.order.findMany({ where: { userId, status } }),
    );

    return pipe(
      ordersPromise,
      Effect.map((orders) => orders.map(OrderModel.from)),
    );
  }
}
