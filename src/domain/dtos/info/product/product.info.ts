import { ProductModel, ProductModelProps } from 'src/domain/models';

export type ProductInfoProps = ProductModelProps;

export class ProductInfo {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: ProductInfoProps) {
    this.id = props.id;
    this.name = props.name;
    this.price = props.price;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static from(domain: ProductModel): ProductInfo {
    return new ProductInfo({
      id: domain.id,
      name: domain.name,
      price: domain.price,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    });
  }
}
