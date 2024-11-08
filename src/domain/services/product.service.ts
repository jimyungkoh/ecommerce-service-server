import { Inject, Injectable } from '@nestjs/common';
import { ErrorCodes } from 'src/common/errors';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { DeductStockCommand } from 'src/domain/dtos/commands/product/deduct-stock.command';
import {
  ProductRepository,
  ProductStockRepository,
} from 'src/infrastructure/database/repositories';
import { PopularProductRepository } from 'src/infrastructure/database/repositories/popular-product.repository';
import { RedisClient } from 'src/infrastructure/redis/redis.client';
import { CompensateStockCommand } from '../dtos/commands/product/compensate-stock.command';
import { SearchedProductInfo } from '../dtos/info';
import { PopularProductInfo } from '../dtos/info/product/popular-product.info';
import { AppNotFoundException } from '../exceptions';
import { ProductModel, ProductStockModel } from '../models';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productStockRepository: ProductStockRepository,
    private readonly popularProductRepository: PopularProductRepository,
    private readonly redisClient: RedisClient,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  async getBy(productId: number): Promise<SearchedProductInfo> {
    try {
      const cachedProduct = await this.redisClient
        .get(`products:${productId}`)
        .then((product) => {
          if (!product) return null;
          else this.logger.info(`hit! ${JSON.stringify(product)}`);

          const productData = JSON.parse(product);

          return new ProductModel({
            id: Number(productData.id),
            name: productData.name,
            price: Number(productData.price),
            createdAt: new Date(productData.createdAt),
            updatedAt: new Date(productData.updatedAt),
          });
        });

      this.logger.info(`cachedProduct: ${JSON.stringify(cachedProduct)}`);

      const product = cachedProduct
        ? cachedProduct
        : await this.productRepository
            .getById(productId)
            .then(async (product) => {
              this.logger.info(`product: ${JSON.stringify(product)}`);
              await this.redisClient.set(
                `products:${productId}`,
                JSON.stringify({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  createdAt: product.createdAt.toISOString(),
                  updatedAt: product.updatedAt.toISOString(),
                }),
                1000 * 60 * 60, // Cache-Aside 전략 - 1시간 TTL 설정
              );
              return product;
            });

      // 재고는 interactive transaction 이므로 캐시 버전 사용
      const cachedStock = await this.redisClient
        .get(`products:stock:${productId}`)
        .then((stock) => {
          if (!stock) return null;
          const stockData = JSON.parse(stock);
          return new ProductStockModel({
            productId: Number(stockData.productId),
            stock: Number(stockData.stock),
            createdAt: new Date(stockData.createdAt),
            updatedAt: new Date(stockData.updatedAt),
          });
        });

      const stock = cachedStock
        ? cachedStock
        : await this.productStockRepository
            .getById(productId)
            .then(async (stock) => {
              await this.redisClient.set(
                `products:stock:${productId}`,
                JSON.stringify({
                  productId: stock.productId,
                  stock: stock.stock,
                  createdAt: stock.createdAt.toISOString(),
                  updatedAt: stock.updatedAt.toISOString(),
                }), // 캐시 버전 사용
                1000 * 60 * 5, // Cache-Aside 전략 - 5분 TTL 설정
              );
              return stock;
            });

      this.logger.info(
        `product: ${JSON.stringify(product)}\nstock: ${JSON.stringify(stock)}`,
      );
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

  async compensateStock(command: CompensateStockCommand): Promise<void> {
    command.orderItems
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
      .forEach(async ({ productId, quantity }) => {
        const parsedStock = await this.redisClient
          .get(`products:stock:${productId}`)
          .then((stock) => {
            if (!stock) return null;
            const stockData = JSON.parse(stock);
            return new ProductStockModel({
              productId: Number(stockData.productId),
              stock: Number(stockData.stock),
              createdAt: new Date(stockData.createdAt),
              updatedAt: new Date(stockData.updatedAt),
            });
          });

        if (!parsedStock) {
          return;
        }

        const updatedStock = parsedStock.stock + quantity;

        await this.redisClient.set(
          `products:stock:${productId}`,
          JSON.stringify({
            productId: parsedStock.productId,
            stock: updatedStock,
            createdAt: parsedStock.createdAt.toISOString(),
            updatedAt: parsedStock.updatedAt.toISOString(),
          }),
          1000 * 60 * 5, // Cache-Aside 전략 - 5분 TTL 설정
        );
      });
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
              JSON.stringify({
                popularProducts: popularProducts.map((popularProduct) => {
                  return {
                    id: popularProduct.id,
                    productId: popularProduct.productId,
                    salesCount: popularProduct.salesCount,
                    aggregationDate:
                      popularProduct.aggregationDate.toISOString(),
                    createdAt: popularProduct.createdAt.toISOString(),
                    updatedAt: popularProduct.updatedAt.toISOString(),
                  };
                }),
              }),
              1000 * 60 * 60 * 24, // Cache-Aside 전략 - 1일 TTL 설정
            );
            return popularProducts;
          });

    return PopularProductInfo.fromList(popularProducts);
  }
}
