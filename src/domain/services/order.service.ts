import { Effect, pipe } from 'effect';
import { Domain } from 'src/common/decorators';
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
import { Prisma } from '@prisma/client';

@Domain()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
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
        tx,
      );

    const createOrderItems = (
      order: OrderModel,
      command: CreateOrderCommand,
      tx: Prisma.TransactionClient,
    ) =>
      pipe(
        command.orderItems.map((orderItem) =>
          this.orderItemRepository.create(
            CreateOrderItemParam.from(order, orderItem),
            tx,
          ),
        ),
        Effect.all,
        Effect.map((orderItems) => CreateOrderInfo.from(order, orderItems)),
      );

    return pipe(
      createOrder(command, tx),
      Effect.flatMap((order) => createOrderItems(order, command, tx)),
    );
  }

  updateOrderStatus(
    command: UpdateOrderStatusCommand,
  ): Effect.Effect<OrderInfo, Error | AppNotFoundException> {
    return pipe(
      this.orderRepository.getById(command.orderId, command.transaction),
      Effect.flatMap((order) =>
        this.orderRepository.update(
          order.id,
          { status: command.status },
          command.transaction,
        ),
      ),
      Effect.map(OrderInfo.from),
      Effect.catchAll((e) => Effect.fail(e)),
    );
  }
}
