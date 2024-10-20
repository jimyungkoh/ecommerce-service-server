import Decimal from 'decimal.js';
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
export class OrderDomain {
  constructor(
    readonly id: bigint,
    readonly userId: number,
    readonly status: OrderStatus,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  totalAmount(orderItems: OrderItemDomain[]): Decimal {
    return orderItems.reduce(
      (acc, cur) => acc.plus(cur.price.times(cur.quantity)),
      new Decimal(0),
    );
  }
}
