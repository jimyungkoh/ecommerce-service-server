import { OrderItem } from '@prisma/client';

export type OrderItemModelProps = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};

export class OrderItemModel {
  readonly id: number;
  readonly orderId: number;
  readonly productId: number;
  readonly quantity: number;
  readonly price: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: OrderItemModelProps) {
    this.id = props.id;
    this.orderId = props.orderId;
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.price = props.price;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static from(orderItem: OrderItem): OrderItemModel {
    return new OrderItemModel({
      id: Number(orderItem.id),
      orderId: Number(orderItem.orderId),
      productId: Number(orderItem.productId),
      quantity: orderItem.quantity,
      price: Number(orderItem.price),
      createdAt: orderItem.createdAt,
      updatedAt: orderItem.updatedAt,
    });
  }
}
