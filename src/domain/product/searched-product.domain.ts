import Decimal from 'decimal.js';

export class SearchedProductDomain {
  constructor(
    readonly id: bigint,
    readonly name: string,
    readonly price: Decimal,
    readonly stock: number,
  ) {}
}
