import Decimal from 'decimal.js';
import { ProductStockDomain } from './product-stock.domain';

export class ProductDomain {
  readonly stock?: number;

  constructor(
    readonly id: bigint,
    readonly name: string,
    readonly price: Decimal,
    readonly createdAt: Date,
    readonly updatedAt: Date,
    readonly productStock?: ProductStockDomain,
  ) {}

  getStock(): number | undefined {
    return this.productStock?.stock;
  }
}
