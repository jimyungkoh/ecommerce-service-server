import { PopularProduct } from '@prisma/client';

export type PopularProductModelProps = {
  id: number;
  productId: number;
  salesCount: number;
  aggregationDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class PopularProductModel {
  readonly id: number;
  readonly productId: number;
  readonly salesCount: number;
  readonly aggregationDate: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: PopularProductModelProps) {
    this.id = props.id;
    this.productId = props.productId;
    this.salesCount = props.salesCount;
    this.aggregationDate = props.aggregationDate;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static from(popularProduct: PopularProduct): PopularProductModel {
    return new PopularProductModel({
      id: Number(popularProduct.id),
      productId: Number(popularProduct.productId),
      salesCount: Number(popularProduct.salesCount),
      aggregationDate: popularProduct.aggregationDate,
      createdAt: popularProduct.createdAt,
      updatedAt: popularProduct.updatedAt,
    });
  }
}
