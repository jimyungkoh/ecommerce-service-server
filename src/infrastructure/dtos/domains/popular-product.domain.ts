export type PopularProductDomainProps = {
  id: bigint;
  productId: bigint;
  salesCount: bigint;
  aggregationDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class PopularProductDomain {
  constructor(private readonly props: PopularProductDomainProps) {}

  get id(): bigint {
    return this.props.id;
  }

  get productId(): bigint {
    return this.props.productId;
  }

  get salesCount(): bigint {
    return this.props.salesCount;
  }

  get aggregationDate(): Date {
    return this.props.aggregationDate;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
