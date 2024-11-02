export type AddCartItemCommandProps = {
  cartId: number;
  productId: number;
  quantity: number;
};

export class AddCartItemCommand {
  constructor(private readonly props: AddCartItemCommandProps) {}

  get cartId(): number {
    return this.props.cartId;
  }

  get productId(): number {
    return this.props.productId;
  }

  get quantity(): number {
    return this.props.quantity;
  }
}
