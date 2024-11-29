import { ProductStock } from '@prisma/client';
import { Effect } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import { AppConflictException } from 'src/domain/exceptions';

export type ProductStockModelProps = {
  productId: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
};

export class ProductStockModel {
  readonly productId: number;
  stock: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: ProductStockModelProps) {
    this.productId = props.productId;
    this.stock = props.stock;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  inStock(quantity: number): boolean {
    return this.stock >= quantity;
  }

  deduct(
    quantity: number,
  ): Effect.Effect<ProductStockModel, AppConflictException> {
    return Effect.if(this.inStock(quantity), {
      onTrue: () => {
        this.stock -= quantity;
        return Effect.succeed(this);
      },
      onFalse: () =>
        Effect.fail(new AppConflictException(ErrorCodes.PRODUCT_OUT_OF_STOCK)),
    });
  }

  add(quantity: number): Effect.Effect<ProductStockModel, never> {
    this.stock += quantity;
    return Effect.succeed(this);
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
