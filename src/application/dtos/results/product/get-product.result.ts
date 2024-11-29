import { ProductInfo, ProductStockInfo } from '../../../../domain/dtos';

export class GetProductResult {
  readonly product: ProductInfo;
  readonly productStock: ProductStockInfo;

  constructor(product: ProductInfo, productStock: ProductStockInfo) {
    this.product = product;
    this.productStock = productStock;
  }

  static from(product: ProductInfo, productStock: ProductStockInfo) {
    return new GetProductResult(product, productStock);
  }
}
