import { OrderItemModel, OrderItemModelProps } from 'src/domain/models';

export type OrderItemInfoProps = OrderItemModelProps;

export class OrderItemInfo {
  readonly id: number;
  readonly orderId: number;
  readonly productId: number;
  readonly quantity: number;
  readonly price: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: OrderItemInfoProps) {
    this.id = props.id;
    this.orderId = props.orderId;
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.price = props.price;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static from(domain: OrderItemModel): OrderItemInfo {
    return new OrderItemInfo(domain);
  }
}
