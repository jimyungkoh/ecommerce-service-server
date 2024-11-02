import {
  CartItemDomain,
  CartItemDomainProps,
} from 'src/infrastructure/dtos/domains';
import { InfoDTO } from '../info';

export type CartItemInfoProps = CartItemDomainProps;

export class CartItemInfo extends InfoDTO<CartItemInfoProps> {
  constructor(props: CartItemInfoProps) {
    super(props);
  }

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

  static from(domain: CartItemDomain): CartItemInfo {
    return new CartItemInfo(domain);
  }
}
