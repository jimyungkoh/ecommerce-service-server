export type RemoveCartItemCommandProps = {
  userId: number;
  productId: bigint;
};

export class RemoveCartItemCommand {
  constructor(private readonly props: RemoveCartItemCommandProps) {}

  get userId(): number {
    return this.props.userId;
  }

  get productId(): bigint {
    return this.props.productId;
  }
}
