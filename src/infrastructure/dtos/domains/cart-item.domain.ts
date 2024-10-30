export type CartItemDomainProps = {
  id: bigint;
  cartId: number;
  productId: bigint;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
};

export class CartItemDomain {
  constructor(private readonly props: CartItemDomainProps) {}

  get id(): bigint {
    return this.props.id;
  }

  get cartId(): number {
    return this.props.cartId;
  }

  get productId(): bigint {
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
}
