import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { ErrorCodes } from 'src/common/errors';
import { CreateOrderCommand } from 'src/domain/dtos/commands/order/create-order.command';
import { UserRepository } from 'src/infrastructure/database/repositories';
import { OrderItemRepository } from 'src/infrastructure/database/repositories/order-item.repository';
import { OrderRepository } from 'src/infrastructure/database/repositories/order.repository';
import { UpdateOrderStatusCommand } from '../dtos/commands/order/update-order-status.command';
import { OrderInfo } from '../dtos/info';
import { CreateOrderInfo } from '../dtos/info/order/create-order.result';
import { AppNotFoundException } from '../exceptions';

@Injectable()
export class OrderService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}

  async createOrder(command: CreateOrderCommand): Promise<CreateOrderInfo> {
    await this.userRepository
      .getById(command.userId, command.transaction)
      .catch(() => {
        throw new AppNotFoundException(ErrorCodes.USER_NOT_FOUND);
      });

    const order = await this.orderRepository.create(
      {
        userId: command.userId,
        status: OrderStatus.PENDING_PAYMENT,
      },
      command.transaction,
    );

    const createdOrderItems = [];
    for (const orderItem of command.orderItems) {
      const createdOrderItem = await this.orderItemRepository.create(
        {
          orderId: order.id,
          productId: orderItem.productId,
          quantity: orderItem.quantity,
          price: orderItem.price,
        },
        command.transaction,
      );

      createdOrderItems.push(createdOrderItem);
    }

    return CreateOrderInfo.from(order, createdOrderItems);
  }

  async updateOrderStatus(
    command: UpdateOrderStatusCommand,
  ): Promise<OrderInfo> {
    try {
      await this.orderRepository.getById(command.orderId, command.transaction);
    } catch {
      throw new AppNotFoundException(ErrorCodes.ORDER_NOT_FOUND);
    }

    const updatedOrder = await this.orderRepository.update(
      command.orderId,
      { status: command.status },
      command.transaction,
    );

    return OrderInfo.from(updatedOrder);
  }
}
