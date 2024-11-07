import { Injectable } from '@nestjs/common';
import { ErrorCodes } from 'src/common/errors';
import { DeductStockCommand } from 'src/domain/dtos/commands/product/deduct-stock.command';
import {
  ProductRepository,
  ProductStockRepository,
} from 'src/infrastructure/database/repositories';
import { PopularProductRepository } from 'src/infrastructure/database/repositories/popular-product.repository';
import { RedisClient } from 'src/infrastructure/redis/redis.service';
import { SearchedProductInfo } from '../dtos/info';
import { PopularProductInfo } from '../dtos/info/product/popular-product.info';
import { AppNotFoundException } from '../exceptions';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productStockRepository: ProductStockRepository,
    private readonly popularProductRepository: PopularProductRepository,
    private readonly redisClient: RedisClient,
  ) {}

  async getBy(productId: number): Promise<SearchedProductInfo> {
    try {
      const cachedProduct = await this.redisClient.get(`products:${productId}`);

      const product = cachedProduct
        ? JSON.parse(cachedProduct)
        : await this.productRepository
            .getById(productId)
            .then(async (product) => {
              await this.redisClient.set(
                `product:${productId}`,
                JSON.stringify(product),
                1000 * 60 * 60, // Cache-Aside 전략 - 1시간 TTL 설정
              );
              return product;
            });

      const cachedStock = await this.redisClient.get(
        `products:stock:${productId}`,
      );
      const stock = cachedStock
        ? JSON.parse(cachedStock)
        : await this.productStockRepository
            .getById(productId)
            .then(async (stock) => {
              await this.redisClient.set(
                `product:stock:${productId}`,
                JSON.stringify(stock),
                1000 * 60 * 5, // Cache-Aside 전략 - 5분 TTL 설정
              );
              return stock;
            });

      return SearchedProductInfo.from(product, stock);
    } catch {
      throw new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND);
    }
  }

  async deductStock(command: DeductStockCommand): Promise<void> {
    const productIds = command.orderItems.map((item) => item.productId);

    // 1. 모든 상품의 재고를 한번에 비관적 락으로 조회
    const productStocks = await this.productStockRepository
      .getByIdsWithXLock(productIds, command.transaction)
      .catch(() => {
        throw new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND);
      });

    // 2. 재고 차감 검증 및 업데이트할 데이터 준비
    const updates = command.orderItems.map((orderItem) => {
      const stock = productStocks.find(
        (ps) => ps.productId === orderItem.productId,
      );

      if (!stock) {
        throw new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND);
      }

      const updatedStock = stock.deductStock(orderItem.quantity);

      return {
        productId: orderItem.productId,
        stock: updatedStock.stock,
      };
    });

    // 3. 벌크 업데이트 실행
    await this.productStockRepository.updateBulk(updates, command.transaction);
  }

  async getPopularProducts(date: Date): Promise<PopularProductInfo[]> {
    const cachedPopularProducts = await this.redisClient.get(
      `products:popular:${date.toISOString()}`,
    );

    const popularProducts = cachedPopularProducts
      ? JSON.parse(cachedPopularProducts)
      : await this.popularProductRepository
          .findByAggregationDate(date)
          .then(async (popularProducts) => {
            await this.redisClient.set(
              `products:popular:${date.toISOString()}`,
              JSON.stringify(popularProducts),
              1000 * 60 * 60 * 24, // Cache-Aside 전략 - 1일 TTL 설정
            );
            return popularProducts;
          });

    return PopularProductInfo.fromList(popularProducts);
  }
}
