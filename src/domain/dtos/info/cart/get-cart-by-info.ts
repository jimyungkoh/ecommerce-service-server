import { CartItemModel, CartModel } from 'src/domain/models';
import { InfoDTO } from '../info';
import { CartItemInfo } from './cart-item.info';
import { CartInfo } from './cart.info';

export type GetCartByInfoProps = {
  cart: CartInfo;
  cartItems: CartItemInfo[];
};

export class GetCartByInfo extends InfoDTO<GetCartByInfoProps> {
  constructor(props: GetCartByInfoProps) {
    super(props);
  }

  get cart(): CartInfo {
    return this.props.cart;
  }

  get cartItems(): CartItemInfo[] {
    return this.props.cartItems;
  }

  static from(domain: CartModel, cartItems: CartItemModel[]): GetCartByInfo {
    return new GetCartByInfo({
      cart: CartInfo.from(domain),
      cartItems: cartItems.map((cartItem) => CartItemInfo.from(cartItem)),
    });
  }
}
