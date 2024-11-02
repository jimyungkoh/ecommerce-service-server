import {
  ProductDomain,
  ProductStockDomain,
  ProductStockDomainProps,
} from 'src/infrastructure/dtos/domains';
import { InfoDTO } from '../info';
import { ProductInfoProps } from './product.info';

export type SearchedProductInfoProps = Pick<
  ProductInfoProps,
  'id' | 'name' | 'price'
> &
  Pick<ProductStockDomainProps, 'stock'>;

export class SearchedProductInfo extends InfoDTO<SearchedProductInfoProps> {
  constructor(props: SearchedProductInfoProps) {
    super(props);
  }

  get id(): number {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get price(): number {
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
