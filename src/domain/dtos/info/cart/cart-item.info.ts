import {
  CartItemDomain,
  CartItemDomainProps,
} from 'src/infrastructure/dtos/domains';

export type CartItemInfoProps = CartItemDomainProps;

export class CartItemInfo {
  constructor(private readonly props: CartItemInfoProps) {}

  get id(): string {
    return this.props.id.toString();
  }

  get cartId(): number {
    return this.props.cartId;
  }

  get productId(): string {
    return this.props.productId.toString();
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
