import { ProductStockDomain } from 'src/infrastructure/dtos/domains';

export type ProductStockInfoProps = ProductStockDomain;

export class ProductStockInfo {
  constructor(private readonly props: ProductStockInfoProps) {}

  get productId(): string {
    return this.props.productId.toString();
  }

  get stock(): number {
    return this.props.stock;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  inStock(quantity: number): boolean {
    return this.stock >= quantity;
  }

  static from(domain: ProductStockDomain): ProductStockInfo {
    return new ProductStockInfo(domain);
  }
}
