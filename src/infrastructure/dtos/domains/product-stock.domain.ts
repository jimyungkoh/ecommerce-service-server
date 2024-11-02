import { ProductStock } from '@prisma/client';
import { ErrorCodes } from 'src/common/errors';
import { AppConflictException } from 'src/domain/exceptions';

export type ProductStockDomainProps = {
  productId: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
};

export class ProductStockDomain {
  constructor(private readonly props: ProductStockDomainProps) {}

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

  deductStock(quantity: number): this {
    if (!this.inStock(quantity))
      throw new AppConflictException(ErrorCodes.PRODUCT_OUT_OF_STOCK);

    this.props.stock -= quantity;

    return this;
  }

  static from(product: ProductStock): ProductStockDomain {
    return new ProductStockDomain({
      productId: Number(product.productId),
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }
}
