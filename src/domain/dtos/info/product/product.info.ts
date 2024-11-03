import {
  ProductModel,
  ProductModelProps,
  ProductStockModel,
} from 'src/domain/models';
import { InfoDTO } from '../info';
import { ProductStockInfo } from './product-stock.info';

export type ProductInfoProps = ProductModelProps & {
  productStock: ProductStockModel;
};

export class ProductInfo extends InfoDTO<ProductInfoProps> {
  constructor(props: ProductInfoProps) {
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
    domain: ProductModel,
    productStock: ProductStockModel,
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
