import { Product } from '@prisma/client';

export type ProductDomainProps = {
  id: number;
  name: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};

export class ProductDomain {
  constructor(private readonly props: ProductDomainProps) {}

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

  static from(product: Product): ProductDomain {
    return new ProductDomain({
      id: Number(product.id),
      name: product.name,
      price: Number(product.price),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }
}
