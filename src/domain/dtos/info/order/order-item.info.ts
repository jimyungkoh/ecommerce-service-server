import { OrderItemModel, OrderItemModelProps } from 'src/domain/models';

export type OrderItemInfoProps = OrderItemModelProps;

export class OrderItemInfo {
  readonly id: number;
  readonly orderId: number;
  readonly productId: number;
  readonly quantity: number;
  readonly price: number;

  constructor(props: OrderItemInfoProps) {
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.price = props.price;
  }

  static from(domain: OrderItemModel): OrderItemInfo {
    return new OrderItemInfo(domain);
  }
}
