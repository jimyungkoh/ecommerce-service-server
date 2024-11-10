import { OrderModel, OrderModelProps, OrderStatus } from 'src/domain/models';
import { OrderItemInfo } from './order-item.info';

export type OrderInfoProps = OrderModelProps;

export class OrderInfo {
  readonly id: number;
  readonly userId: number;
  readonly status: OrderStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: OrderInfoProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  totalAmount(orderItems: OrderItemInfo[]): number {
    return orderItems
      .map((item) => item.price * item.quantity)
      .reduce((acc, cur) => acc + cur, 0);
  }

  static from(domain: OrderModel): OrderInfo {
    return new OrderInfo(domain);
  }
}
