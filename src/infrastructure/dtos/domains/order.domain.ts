import { Order } from '@prisma/client';
import { OrderItemDomain } from './order-item.domain';

export const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUND_REQUESTED: 'REFUND_REQUESTED',
  REFUNDED: 'REFUNDED',
  COMPLETED: 'COMPLETED',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export type OrderDomainProps = {
  id: number;
  userId: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

export class OrderDomain {
  constructor(private readonly props: OrderDomainProps) {}

  get id(): number {
    return this.props.id;
  }

  get userId(): number {
    return this.props.userId;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  totalAmount(orderItems: OrderItemDomain[]): number {
    return orderItems.reduce((acc, cur) => acc + cur.price * cur.quantity, 0);
  }

  static from(order: Order): OrderDomain {
    return new OrderDomain({
      id: Number(order.id),
      userId: order.userId,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  }
}
