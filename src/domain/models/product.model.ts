import { Product } from '@prisma/client';

export type ProductModelProps = {
  id: number;
  name: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};

export class ProductModel {
  id: number;
  name: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(readonly props: ProductModelProps) {
    this.id = props.id;
    this.name = props.name;
    this.price = props.price;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static from(product: Product): ProductModel {
    return new ProductModel({
      id: Number(product.id),
      name: product.name,
      price: Number(product.price),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      price: this.price,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
