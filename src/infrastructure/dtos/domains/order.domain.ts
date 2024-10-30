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

export type OrderDomainProps = {
  id: bigint;
  userId: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

export class OrderDomain {
  constructor(private readonly props: OrderDomainProps) {}

  get id(): bigint {
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

  totalAmount(orderItems: OrderItemDomain[]): Decimal {
    return orderItems.reduce(
      (acc, cur) => acc.plus(cur.price.times(cur.quantity)),
      new Decimal(0),
    );
  }
}
