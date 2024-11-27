import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { Domain } from 'src/common/decorators';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
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
} from '../dtos';
import { ProductStockModel } from '../models';

@Domain()
export class ProductService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly productRepository: ProductRepository,
    private readonly popularProductRepository: PopularProductRepository,
    private readonly productStockRepository: ProductStockRepository,
  ) {}

  getBy(productId: number) {
    const getProduct = this.productRepository.getById(productId);

    return pipe(getProduct, Effect.map(ProductInfo.from));
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
}
