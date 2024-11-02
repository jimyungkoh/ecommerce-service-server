import { Cart } from '@prisma/client';

export type CartDomainProps = {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

export class CartDomain {
  constructor(private readonly props: CartDomainProps) {}

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

  static from(cart: Cart): CartDomain {
    return new CartDomain({
      id: cart.id,
      userId: cart.userId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    });
  }
}
