export type AddCartItemCommandProps = {
  cartId: number;
  productId: number;
  quantity: number;
};

export class AddCartItemCommand {
  readonly cartId: number;
  readonly productId: number;
  readonly quantity: number;

  constructor(props: AddCartItemCommandProps) {
    this.cartId = props.cartId;
    this.productId = props.productId;
    this.quantity = props.quantity;
  }
}
