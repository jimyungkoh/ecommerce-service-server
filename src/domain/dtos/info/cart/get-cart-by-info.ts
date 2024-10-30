import { CartDomain, CartItemDomain } from 'src/infrastructure/dtos/domains';
import { CartItemInfo } from './cart-item.info';
import { CartInfo } from './cart.info';

export type GetCartByInfoProps = {
  cart: CartInfo;
  cartItems: CartItemInfo[];
};

export class GetCartByInfo {
  constructor(private readonly props: GetCartByInfoProps) {}

  get cart(): CartInfo {
    return this.props.cart;
  }

  get cartItems(): CartItemInfo[] {
    return this.props.cartItems;
  }

  static from(domain: CartDomain, cartItems: CartItemDomain[]): GetCartByInfo {
    return new GetCartByInfo({
      cart: CartInfo.from(domain),
      cartItems: cartItems.map((cartItem) => CartItemInfo.from(cartItem)),
    });
  }
}
