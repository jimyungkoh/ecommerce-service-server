import { CartItemModel, CartItemModelProps } from 'src/domain/models';

export type CartItemInfoProps = CartItemModelProps;

export class CartItemInfo {
  readonly id: number;
  readonly cartId: number;
  readonly productId: number;
  readonly quantity: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: CartItemInfoProps) {
    this.id = props.id;
    this.cartId = props.cartId;
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static from(domain: CartItemModel): CartItemInfo {
    return new CartItemInfo(domain);
  }
}
