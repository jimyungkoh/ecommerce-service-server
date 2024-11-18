import { CartModel, CartModelProps } from 'src/domain/models';

export type CartInfoProps = CartModelProps;

export class CartInfo {
  readonly id: number;
  readonly userId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: CartInfoProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static from(domain: CartModel): CartInfo {
    return new CartInfo(domain);
  }
}
