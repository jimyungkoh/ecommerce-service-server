export type RemoveCartItemCommandProps = {
  userId: number;
  productId: number;
};

export class RemoveCartItemCommand {
  readonly userId: number;
  readonly productId: number;

  constructor(props: RemoveCartItemCommandProps) {
    this.userId = props.userId;
    this.productId = props.productId;
  }
}
