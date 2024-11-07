import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { CreateOrderCommand } from 'src/domain/dtos/commands/order/create-order.command';
import { UserRepository } from 'src/infrastructure/database/repositories';
import { OrderItemRepository } from 'src/infrastructure/database/repositories/order-item.repository';
import { OrderRepository } from 'src/infrastructure/database/repositories/order.repository';
import { UpdateOrderStatusCommand } from '../dtos/commands/order/update-order-status.command';
import { OrderInfo } from '../dtos/info';
import { CreateOrderInfo } from '../dtos/info/order/create-order.result';
import { AppNotFoundException } from '../exceptions';
import { OrderModel } from '../models';

@Injectable()
export class OrderService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}

  createOrder(
    command: CreateOrderCommand,
  ): Effect.Effect<CreateOrderInfo, Error | AppNotFoundException> {
    const getUserEffect = this.userRepository.getById(command.userId);
    const createOrderEffect = this.orderRepository.create(
      {
        userId: command.userId,
        status: OrderStatus.PENDING_PAYMENT,
      },
      command.transaction,
    );
    const createOrderItemEffects = (order: OrderModel) =>
      command.orderItems.map((orderItem) =>
        this.orderItemRepository.create({
          orderId: order.id,
          productId: orderItem.productId,
          quantity: orderItem.quantity,
          price: orderItem.price,
        }),
      );

    return pipe(
      getUserEffect,
      Effect.flatMap(() => createOrderEffect),
      Effect.flatMap((order) =>
        pipe(
          Effect.all(createOrderItemEffects(order)),
          Effect.map((orderItems) => CreateOrderInfo.from(order, orderItems)),
        ),
      ),
    );
  }

  // await
  // const order = await this.orderRepository.create(
  //   {
  //     userId: command.userId,
  //     status: OrderStatus.PENDING_PAYMENT,
  //   },
  //   command.transaction,
  // );

  // const createdOrderItems = [];
  // for (const orderItem of command.orderItems) {
  //   const createdOrderItem = await this.orderItemRepository.create(
  //     {
  //       orderId: order.id,
  //       productId: orderItem.productId,
  //       quantity: orderItem.quantity,
  //       price: orderItem.price,
  //     },
  //     command.transaction,
  //   );

  //   createdOrderItems.push(createdOrderItem);
  // }

  // return CreateOrderInfo.from(order, createdOrderItems);

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
    );
  }
}
