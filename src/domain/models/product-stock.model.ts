import { ProductStock } from '@prisma/client';
import { ErrorCodes } from 'src/common/errors';
import { AppConflictException } from 'src/domain/exceptions';

export type ProductStockModelProps = {
  productId: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
};

export class ProductStockModel {
  productId: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(readonly props: ProductStockModelProps) {
    this.productId = props.productId;
    this.stock = props.stock;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  inStock(quantity: number): boolean {
    return this.stock >= quantity;
  }

  deductStock(quantity: number): this {
    if (!this.inStock(quantity))
      throw new AppConflictException(ErrorCodes.PRODUCT_OUT_OF_STOCK);

    this.stock -= quantity;

    return this;
  }

  static from(product: ProductStock): ProductStockModel {
    return new ProductStockModel({
      productId: Number(product.productId),
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }
}
