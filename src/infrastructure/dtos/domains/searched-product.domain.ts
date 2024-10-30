import Decimal from 'decimal.js';

export type SearchedProductDomainProps = {
  id: bigint;
  name: string;
  price: Decimal;
  stock: number;
};

export class SearchedProductDomain {
  constructor(private readonly props: SearchedProductDomainProps) {}

  get id(): bigint {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get price(): Decimal {
    return this.props.price;
  }

  get stock(): number {
    return this.props.stock;
  }
}
