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
    const productIds = command.orderItems.map((item) => BigInt(item.productId));

    // 1. 모든 상품의 재고를 한번에 비관적 락으로 조회
    const productStocks = await this.productStockRepository
      .getByIds(productIds, command.transaction, true)
      .catch(() => {
        throw new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND);
      });

    // 2. 재고 차감 검증 및 업데이트할 데이터 준비
    const updates = command.orderItems.map((orderItem) => {
      const stock = productStocks.find(
        (ps) => ps.productId === BigInt(orderItem.productId),
      );

      if (!stock) {
        throw new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND);
      }

      const updatedStock = stock.deductStock(orderItem.quantity);

      return {
        productId: BigInt(orderItem.productId),
        stock: updatedStock.stock,
      };
    });

    // 3. 벌크 업데이트 실행
    await this.productStockRepository.updateBulk(updates, command.transaction);
  }

  async getPopularProducts(date: Date): Promise<PopularProductInfo[]> {
    const popularProducts =
      await this.popularProductRepository.findByAggregationDate(date);

    return PopularProductInfo.fromList(popularProducts);
  }
}
