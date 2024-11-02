import { CartDomain, CartDomainProps } from 'src/infrastructure/dtos/domains';
import { InfoDTO } from '../info';

export type CartInfoProps = CartDomainProps;

export class CartInfo extends InfoDTO<CartInfoProps> {
  constructor(props: CartInfoProps) {
    super(props);
  }

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
