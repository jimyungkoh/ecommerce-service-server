import { OrderItemModel, OrderModel } from 'src/domain/models';
import { OrderItemInfo } from './order-item.info';
import { OrderInfo } from './order.info';

export type CreateOrderInfoProps = {
  order: OrderInfo;
  orderItems: OrderItemInfo[];
};

export class CreateOrderInfo {
  readonly order: OrderInfo;
  readonly orderItems: OrderItemInfo[];

  constructor(props: CreateOrderInfoProps) {
    this.order = props.order;
    this.orderItems = props.orderItems;
  }

  static from(
    domain: OrderModel,
    orderItems: OrderItemModel[],
  ): CreateOrderInfo {
    return new CreateOrderInfo({
      order: OrderInfo.from(domain),
      orderItems: orderItems.map((orderItem) => OrderItemInfo.from(orderItem)),
    });
  }
}
