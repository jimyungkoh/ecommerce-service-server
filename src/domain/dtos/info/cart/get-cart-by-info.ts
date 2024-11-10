import { CartItemModel, CartModel } from 'src/domain/models';
import { CartItemInfo } from './cart-item.info';
import { CartInfo } from './cart.info';

export type GetCartByInfoProps = {
  cart: CartInfo;
  cartItems: CartItemInfo[];
};

export class GetCartByInfo {
  readonly cart: CartInfo;
  readonly cartItems: CartItemInfo[];

  constructor(props: GetCartByInfoProps) {
    this.cart = props.cart;
    this.cartItems = props.cartItems;
  }

  static from(domain: CartModel, cartItems: CartItemModel[]): GetCartByInfo {
    return new GetCartByInfo({
      cart: CartInfo.from(domain),
      cartItems: cartItems.map((cartItem) => CartItemInfo.from(cartItem)),
    });
  }
}
