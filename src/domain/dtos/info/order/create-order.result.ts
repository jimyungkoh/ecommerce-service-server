import { OrderDomain, OrderItemDomain } from 'src/infrastructure/dtos/domains';
import { OrderItemInfo } from './order-item.info';
import { OrderInfo } from './order.info';

export type CreateOrderInfoProps = {
  order: OrderInfo;
  orderItems: OrderItemInfo[];
};

export class CreateOrderInfo {
  constructor(private readonly props: CreateOrderInfoProps) {}

  get order(): OrderInfo {
    return this.props.order;
  }

  get orderItems(): OrderItemInfo[] {
    return this.props.orderItems;
  }

  get totalAmount(): string {
    return this.props.order.totalAmount(this.props.orderItems);
  }

  static from(
    domain: OrderDomain,
    orderItems: OrderItemDomain[],
  ): CreateOrderInfo {
    return new CreateOrderInfo({
      order: OrderInfo.from(domain),
      orderItems: orderItems.map((orderItem) => OrderItemInfo.from(orderItem)),
    });
  }
}
