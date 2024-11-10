import {
  ProductModel,
  ProductStockModel,
  ProductStockModelProps,
} from 'src/domain/models';
import { ProductInfoProps } from './product.info';

export type SearchedProductInfoProps = Pick<
  ProductInfoProps,
  'id' | 'name' | 'price'
> &
  Pick<ProductStockModelProps, 'stock'>;

export class SearchedProductInfo {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly stock: number;

  constructor(props: SearchedProductInfoProps) {
    this.id = props.id;
    this.name = props.name;
    this.price = props.price;
    this.stock = props.stock;
  }

  static from(
    productDomain: ProductModel,
    stockDomain: ProductStockModel,
  ): SearchedProductInfo {
    return new SearchedProductInfo({
      id: productDomain.id,
      name: productDomain.name,
      price: productDomain.price,
      stock: stockDomain.stock,
    });
  }
}
