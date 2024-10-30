import {
  ProductDomain,
  ProductDomainProps,
  ProductStockDomain,
} from 'src/infrastructure/dtos/domains';
import { ProductStockInfo } from './product-stock.info';

export type ProductInfoProps = ProductDomainProps & {
  productStock: ProductStockDomain;
};

export class ProductInfo {
  constructor(private readonly props: ProductInfoProps) {}

  get id(): bigint {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get price(): string {
    return this.props.price.toString();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get productStock(): ProductStockInfo {
    return ProductStockInfo.from(this.props.productStock);
  }

  static from(
    domain: ProductDomain,
    productStock: ProductStockDomain,
  ): ProductInfo {
    return new ProductInfo({
      id: domain.id,
      name: domain.name,
      price: domain.price,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      productStock,
    });
  }
}
