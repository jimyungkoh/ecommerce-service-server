import { CartItem } from '@prisma/client';

export type CartItemModelProps = {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
};

export class CartItemModel {
  readonly id: number;
  readonly cartId: number;
  readonly productId: number;
  readonly quantity: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: CartItemModelProps) {
    this.id = props.id;
    this.cartId = props.cartId;
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static ofList(cartItems: CartItem[]): CartItemModel[] {
    return cartItems.map(
      (cartItem) =>
        new CartItemModel({
          ...cartItem,
          id: Number(cartItem.id),
          productId: Number(cartItem.productId),
        }),
    );
  }

  static of(cartItem: CartItem): CartItemModel {
    return new CartItemModel({
      ...cartItem,
      id: Number(cartItem.id),
      productId: Number(cartItem.productId),
    });
  }
}
