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
  constructor(private readonly props: OrderItemModelProps) {}

  get id(): number {
    return this.props.id;
  }

  get orderId(): number {
    return this.props.orderId;
  }

  get productId(): number {
    return this.props.productId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get price(): number {
    return this.props.price;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
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

  toJSON() {
    return {
      id: this.id,
      orderId: this.orderId,
      productId: this.productId,
      quantity: this.quantity,
      price: this.price,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
