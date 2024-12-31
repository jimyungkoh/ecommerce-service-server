import { Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { Domain } from 'src/common/decorators';
import { ErrorCodes } from 'src/common/errors';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { ProductStockCacheStore } from 'src/infrastructure/cache/stores/product-stock.cache.store';
import { ProductCacheStore } from 'src/infrastructure/cache/stores/product.cache.store';
import {
  ProductRepository,
  ProductStockRepository,
} from 'src/infrastructure/database/repositories';
import { PopularProductRepository } from 'src/infrastructure/database/repositories/popular-product.repository';
import {
  DeductStockCommand,
  PopularProductInfo,
  ProductInfo,
  ProductStockInfo,
  ReserveStockCommand,
} from '../dtos';
import { AppBadRequestException } from '../exceptions';
import { ProductStockModel } from '../models';

@Domain()
export class ProductService {
  constructor(
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    private readonly productRepository: ProductRepository,
    private readonly popularProductRepository: PopularProductRepository,
    private readonly productStockRepository: ProductStockRepository,
    private readonly productCacheStore: ProductCacheStore,
    private readonly productStockCacheStore: ProductStockCacheStore,
  ) {}

  getBy(productId: number) {
    const fetchAndCacheProduct = (id: number) =>
      pipe(
        this.productRepository.getById(id),
        Effect.tap(this.productCacheStore.cache.bind(this.productCacheStore)),
        Effect.map(ProductInfo.from),
      );

    return pipe(
      this.productCacheStore.findBy(productId),
      Effect.flatMap((cachedProduct) =>
        cachedProduct
          ? Effect.succeed(cachedProduct)
          : fetchAndCacheProduct(productId),
      ),
    );
  }

  getStockBy(productId: number) {
    const getProductStock = this.productStockRepository.getById(productId);

    return pipe(getProductStock, Effect.map(ProductStockInfo.from));
  }

  getPopularProducts(date: Date) {
    return pipe(
      this.popularProductRepository.findByAggregationDate(date),
      Effect.map((popularProducts) =>
        popularProducts.map(PopularProductInfo.from),
      ),
    );
  }

  deductStock(
    command: DeductStockCommand,
    transaction: Prisma.TransactionClient,
  ) {
    const findStocksWithXLock = (transaction: Prisma.TransactionClient) =>
      this.productStockRepository.findByIdsWithXLock(
        Object.keys(command.orderItems).map(Number),
        transaction,
      );

    const deductStocks = (productStocks: ProductStockModel[]) =>
      Effect.all(
        productStocks.map((stock) =>
          stock.deduct(command.orderItems[stock.productId]),
        ),
      );

    const updateStocks = (
      updates: ProductStockModel[],
      transaction: Prisma.TransactionClient,
    ) => this.productStockRepository.updateBulk(updates, transaction);

    return pipe(
      findStocksWithXLock(transaction),
      Effect.flatMap(deductStocks),
      Effect.flatMap((updates) => updateStocks(updates, transaction)),
      Effect.catchAll((e) => Effect.fail(e)),
    );
  }

  reserveStock(command: ReserveStockCommand) {
    const getCurrentStock = this.productStockRepository.getById(
      command.productId,
    );

    const getReservedStock = this.productStockCacheStore.countReservedStock(
      command.productId,
    );

    const reserveStock = (command: ReserveStockCommand) =>
      pipe(
        this.productStockCacheStore.reserveStock(
          command.productId,
          command.userId,
          command.quantity,
        ),
        Effect.flatMap(() => Effect.succeed(void 0)),
      );

    return pipe(
      Effect.all([getCurrentStock, getReservedStock]),
      Effect.map(
        ([stock, reservedStock]) =>
          Math.floor(stock.stock * 1.2) - reservedStock,
      ),
      Effect.flatMap((availableStock) =>
        Effect.if(availableStock >= command.quantity, {
          onTrue: () => reserveStock(command),
          onFalse: () =>
            Effect.fail(
              new AppBadRequestException(ErrorCodes.TEMPORARY_OUT_OF_STOCK),
            ),
        }),
      ),
    );
  }
}
