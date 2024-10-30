export type AddCartItemCommandProps = {
  cartId: number;
  productId: bigint;
  quantity: number;
};

export class AddCartItemCommand {
  constructor(private readonly props: AddCartItemCommandProps) {}

  get cartId(): number {
    return this.props.cartId;
  }

  get productId(): bigint {
    return this.props.productId;
  }

  get quantity(): number {
    return this.props.quantity;
  }
}
