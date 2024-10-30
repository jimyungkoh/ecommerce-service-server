import { CartDomain, CartDomainProps } from 'src/infrastructure/dtos/domains';

export type CartInfoProps = CartDomainProps;

export class CartInfo {
  constructor(private readonly props: CartInfoProps) {}

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

  static from(domain: CartDomain): CartInfo {
    return new CartInfo(domain);
  }
}
