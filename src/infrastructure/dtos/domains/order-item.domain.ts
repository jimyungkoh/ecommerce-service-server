import { OrderItem } from '@prisma/client';

export type OrderItemDomainProps = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};

export class OrderItemDomain {
  constructor(private readonly props: OrderItemDomainProps) {}

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

  static from(orderItem: OrderItem): OrderItemDomain {
    return new OrderItemDomain({
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
