import Decimal from 'decimal.js';
import {
  OrderDomain,
  OrderDomainProps,
  OrderStatus,
} from 'src/infrastructure/dtos/domains';
import { OrderItemInfo } from './order-item.info';

export type OrderInfoProps = OrderDomainProps;

export class OrderInfo {
  constructor(private readonly props: OrderInfoProps) {}

  get id(): string {
    return this.props.id.toString();
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

  totalAmount(orderItems: OrderItemInfo[]): string {
    return orderItems
      .map((item) => new Decimal(item.price).times(item.quantity))
      .reduce((acc, cur) => acc.plus(cur), new Decimal(0))
      .toString();
  }

  static from(domain: OrderDomain): OrderInfo {
    return new OrderInfo(domain);
  }
}
