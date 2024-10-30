import { Injectable } from '@nestjs/common';
import { ErrorCodes } from 'src/common/errors';
import { DeductStockCommand } from 'src/domain/dtos/commands/product/deduct-stock.command';
import {
  ProductRepository,
  ProductStockRepository,
} from 'src/infrastructure/database/repositories';
import { PopularProductRepository } from 'src/infrastructure/database/repositories/popular-product.repository';
import { SearchedProductInfo } from '../dtos/info';
import { PopularProductInfo } from '../dtos/info/product/popular-product.info';
import { AppNotFoundException } from '../exceptions';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productStockRepository: ProductStockRepository,
    private readonly popularProductRepository: PopularProductRepository,
  ) {}

  async getBy(productId: bigint): Promise<SearchedProductInfo> {
    try {
      const product = await this.productRepository.getById(productId);
      const stock = await this.productStockRepository.getById(productId);

      return SearchedProductInfo.from(product, stock);
    } catch {
      throw new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND);
    }
  }

  async deductStock(command: DeductStockCommand): Promise<void> {
    for (const orderItem of command.orderItems) {
      const productStock = await this.productStockRepository
        .getById(BigInt(orderItem.productId), command.transaction, true)
        .catch(() => {
          throw new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND);
        });

      const updatedStock = productStock.deductStock(orderItem.quantity);

      await this.productStockRepository.update(
        BigInt(orderItem.productId),
        { stock: updatedStock.stock },
        command.transaction,
      );
    }
  }

  async getPopularProducts(date: Date): Promise<PopularProductInfo[]> {
    const popularProducts =
      await this.popularProductRepository.findByAggregationDate(date);

    return PopularProductInfo.fromList(popularProducts);
  }
}
