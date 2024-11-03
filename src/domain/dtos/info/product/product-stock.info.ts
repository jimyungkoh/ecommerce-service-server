import { ProductStockModel } from 'src/domain/models';
import { InfoDTO } from '../info';

export type ProductStockInfoProps = ProductStockModel;

export class ProductStockInfo extends InfoDTO<ProductStockInfoProps> {
  constructor(props: ProductStockInfoProps) {
    super(props);
  }

  get productId(): number {
    return this.props.productId;
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

  static from(domain: ProductStockModel): ProductStockInfo {
    return new ProductStockInfo(domain);
  }
}
