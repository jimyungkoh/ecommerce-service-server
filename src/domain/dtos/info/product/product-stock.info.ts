import { ProductStockModel } from 'src/domain/models';

export type ProductStockInfoProps = {
  productId: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
};

export class ProductStockInfo {
  readonly productId: number;
  readonly stock: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: ProductStockInfoProps) {
    this.productId = props.productId;
    this.stock = props.stock;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  inStock(quantity: number): boolean {
    return this.stock >= quantity;
  }

  static from(domain: ProductStockModel): ProductStockInfo {
    return new ProductStockInfo({
      productId: domain.productId,
      stock: domain.stock,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    });
  }
}
