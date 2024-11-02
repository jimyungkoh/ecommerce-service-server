import { CartItem } from '@prisma/client';

export type CartItemDomainProps = {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
};

export class CartItemDomain {
  constructor(private readonly props: CartItemDomainProps) {}

  get id(): number {
    return this.props.id;
  }

  get cartId(): number {
    return this.props.cartId;
  }

  get productId(): number {
    return this.props.productId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static from(cartItem: CartItem): CartItemDomain {
    return new CartItemDomain({
      id: Number(cartItem.id),
      cartId: cartItem.cartId,
      productId: Number(cartItem.productId),
      quantity: cartItem.quantity,
      createdAt: cartItem.createdAt,
      updatedAt: cartItem.updatedAt,
    });
  }
}
