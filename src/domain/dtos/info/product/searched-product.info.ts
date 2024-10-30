import Decimal from 'decimal.js';
import {
  ProductDomain,
  ProductStockDomain,
  ProductStockDomainProps,
} from 'src/infrastructure/dtos/domains';
import { ProductInfoProps } from './product.info';

export type SearchedProductInfoProps = Pick<
  ProductInfoProps,
  'id' | 'name' | 'price'
> &
  Pick<ProductStockDomainProps, 'stock'>;

export class SearchedProductInfo {
  constructor(private readonly props: SearchedProductInfoProps) {}

  get id(): string {
    return this.props.id.toString();
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

  static from(
    productDomain: ProductDomain,
    stockDomain: ProductStockDomain,
  ): SearchedProductInfo {
    return new SearchedProductInfo({
      id: productDomain.id,
      name: productDomain.name,
      price: productDomain.price,
      stock: stockDomain.stock,
    });
  }
}
