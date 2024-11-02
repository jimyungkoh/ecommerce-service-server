import { PopularProduct } from '@prisma/client';

export type PopularProductDomainProps = {
  id: number;
  productId: number;
  salesCount: number;
  aggregationDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class PopularProductDomain {
  constructor(private readonly props: PopularProductDomainProps) {}

  get id(): number {
    return this.props.id;
  }

  get productId(): number {
    return this.props.productId;
  }

  get salesCount(): number {
    return this.props.salesCount;
  }

  get aggregationDate(): Date {
    return this.props.aggregationDate;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static from(popularProduct: PopularProduct): PopularProductDomain {
    return new PopularProductDomain({
      id: Number(popularProduct.id),
      productId: Number(popularProduct.productId),
      salesCount: Number(popularProduct.salesCount),
      aggregationDate: popularProduct.aggregationDate,
      createdAt: popularProduct.createdAt,
      updatedAt: popularProduct.updatedAt,
    });
  }
}
