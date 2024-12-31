import { OrderItem } from '@prisma/client';

export type OrderItemModelProps = {
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
};

export class OrderItemModel {
  readonly orderId: number;
  readonly productId: number;
  readonly quantity: number;
  readonly price: number;

  constructor(props: OrderItemModelProps) {
    this.orderId = props.orderId;
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.price = props.price;
  }

  static from(orderItem: OrderItem): OrderItemModel {
    return new OrderItemModel({
      orderId: Number(orderItem.orderId),
      productId: Number(orderItem.productId),
      quantity: orderItem.quantity,
      price: Number(orderItem.price),
    });
  }
}
