import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { OrderItemModel } from 'src/domain/models/order/order-item.model';
import { CreateOrderItemParam } from 'src/infrastructure/dto/param/order-item/create-order-item.param';
import { Infrastructure } from '../../../common/decorators';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Infrastructure()
export class OrderItemRepository
  implements BaseRepository<OrderItemModel, OrderItemModel>
{
  constructor(private readonly prismaClient: PrismaService) {}

  create(
    param: CreateOrderItemParam,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OrderItemModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const createOrderItem = Effect.tryPromise(() =>
      prisma.orderItem.create({ data: param }),
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
