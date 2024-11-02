export type RemoveCartItemCommandProps = {
  userId: number;
  productId: number;
};

export class RemoveCartItemCommand {
  constructor(private readonly props: RemoveCartItemCommandProps) {}

  get userId(): number {
    return this.props.userId;
  }

  get productId(): number {
    return this.props.productId;
  }
}
