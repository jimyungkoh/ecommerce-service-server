import Decimal from 'decimal.js';

export type ProductDomainProps = {
  id: bigint;
  name: string;
  price: Decimal;
  createdAt: Date;
  updatedAt: Date;
};

export class ProductDomain {
  constructor(private readonly props: ProductDomainProps) {}

  get id(): bigint {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get price(): Decimal {
    return this.props.price;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
