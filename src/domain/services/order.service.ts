import { Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { Domain } from 'src/common/decorators';
import { ErrorCodes } from 'src/common/errors';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import {
  CreateOrderCommand,
  UpdateOrderStatusCommand,
} from 'src/domain/dtos/commands';
import { OrderItemRepository } from 'src/infrastructure/database/repositories/order-item.repository';
import { OrderRepository } from 'src/infrastructure/database/repositories/order.repository';
import { CreateOrderItemParam } from 'src/infrastructure/dto/param/order-item/create-order-item.param';
import { CreateOrderInfo, OrderInfo } from '../dtos';
import { AppNotFoundException } from '../exceptions';
import { OrderModel } from '../models';

@Domain()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  createOrder(command: CreateOrderCommand, tx: Prisma.TransactionClient) {
    const createOrder = (
      command: CreateOrderCommand,
      tx: Prisma.TransactionClient,
    ) =>
      this.orderRepository.create(
        {
          userId: command.userId,
        },
        undefined,
        tx,
      );

    const createOrderItems = (
      order: OrderModel,
      command: CreateOrderCommand,
      tx: Prisma.TransactionClient,
    ) =>
      pipe(
        this.orderItemRepository.createMany(
          command.orderItems.map((orderItem) =>
            CreateOrderItemParam.from(order, orderItem),
          ),
          undefined,
          tx,
        ),
        Effect.map((orderItems) => CreateOrderInfo.from(order, orderItems)),
      );

    return pipe(
      createOrder(command, tx),
      Effect.flatMap((order) => createOrderItems(order, command, tx)),
    );
  }

  getOrder(userId: number, orderId: number) {
    return pipe(
      this.orderRepository.getById(orderId),
      Effect.flatMap((order) =>
        userId !== order.userId
          ? Effect.fail(new AppNotFoundException(ErrorCodes.ORDER_NOT_FOUND))
          : Effect.succeed(OrderInfo.from(order)),
      ),
      Effect.catchAll((e) => Effect.fail(e)),
    );
  }

  updateOrderStatus(
    command: UpdateOrderStatusCommand,
    transaction: Prisma.TransactionClient,
  ): Effect.Effect<OrderInfo, Error | AppNotFoundException> {
    return pipe(
      this.orderRepository.getById(command.orderId, transaction),
      Effect.flatMap((order) =>
        this.orderRepository.update(
          order.id,
          { status: command.status },
          transaction,
        ),
      ),
      Effect.map(OrderInfo.from),
      Effect.catchAll((e) => Effect.fail(e)),
    );
  }
}
