import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Effect, pipe } from 'effect';
import {
  CreateOrderCommand,
  UpdateOrderStatusCommand,
} from 'src/domain/dtos/commands';
import { UserRepository } from 'src/infrastructure/database/repositories';
import { OrderItemRepository } from 'src/infrastructure/database/repositories/order-item.repository';
import { OrderRepository } from 'src/infrastructure/database/repositories/order.repository';
import { CreateOrderInfo, OrderInfo } from '../dtos/info';
import { AppNotFoundException } from '../exceptions';
import { OrderModel } from '../models';

@Injectable()
export class OrderService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}
  createOrder(command: CreateOrderCommand) {
    const getUser = pipe(
      this.userRepository.getById(command.userId, command.transaction),
    );

    const createOrder = (command: CreateOrderCommand) =>
      this.orderRepository.create(
        {
          userId: command.userId,
          status: OrderStatus.PENDING_PAYMENT,
        },
        command.transaction,
      );

    const createOrderItem = (order: OrderModel, command: CreateOrderCommand) =>
      command.orderItems.map((orderItem) =>
        this.orderItemRepository.create(
          {
            orderId: order.id,
            productId: orderItem.productId,
            quantity: orderItem.quantity,
            price: orderItem.price,
          },
          command.transaction,
        ),
      );

    return pipe(
      getUser,
      Effect.flatMap(() => createOrder(command)),
      Effect.flatMap((order) =>
        pipe(
          Effect.all(createOrderItem(order, command)),
          Effect.map((orderItems) => CreateOrderInfo.from(order, orderItems)),
        ),
      ),
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
