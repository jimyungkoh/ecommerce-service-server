import { Injectable } from '@nestjs/common';
import { Order, OrderStatus, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { OrderItemDomain } from 'src/domain';
import { UserRepository } from 'src/infrastructure/database/repositories';
import { OrderItemRepository } from 'src/infrastructure/database/repositories/order-item.repository';
import { OrderRepository } from 'src/infrastructure/database/repositories/order.repository';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';

@Injectable()
export class OrderService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}

  async createOrder(
    userId: number,
    orderItems: Pick<OrderItemDomain, 'productId' | 'quantity' | 'price'>[],
    transaction: Prisma.TransactionClient,
  ): Promise<
    Omit<Order, 'totalAmount'> & {
      orderItems: OrderItemDomain[];
      totalAmount: Decimal;
    }
  > {
    await this.userRepository.getById(userId, transaction).catch(() => {
      throw new UserNotFoundException();
    });

    const order = await this.orderRepository.create(
      {
        userId,
        status: OrderStatus.PENDING_PAYMENT,
      },
      transaction,
    );

    const createdOrderItems = await Promise.all(
      orderItems.map((orderItem) =>
        this.orderItemRepository.create(
          {
            orderId: order.id,
            productId: orderItem.productId,
            quantity: orderItem.quantity,
            price: orderItem.price,
          },
          transaction,
        ),
      ),
    );

    return {
      ...order,
      orderItems: createdOrderItems,
      totalAmount: order.totalAmount(createdOrderItems),
    };
  }

  async updateOrderStatus(
    orderId: bigint,
    status: OrderStatus,
    transaction?: Prisma.TransactionClient,
  ): Promise<Order> {
    return await this.orderRepository.update(orderId, { status }, transaction);
  }
}
