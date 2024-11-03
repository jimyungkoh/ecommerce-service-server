import { Cart } from '@prisma/client';

export type CartModelProps = {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

export class CartModel {
  constructor(private readonly props: CartModelProps) {}

  get id(): number {
    return this.props.id;
  }

  get userId(): number {
    return this.props.userId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static from(cart: Cart): CartModel {
    return new CartModel({
      id: cart.id,
      userId: cart.userId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    });
  }
}
