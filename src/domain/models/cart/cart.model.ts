import { Cart } from '@prisma/client';

export type CartModelProps = {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

export class CartModel {
  readonly id: number;
  readonly userId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: CartModelProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
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
