import { Injectable } from '@nestjs/common';
import { Effect, pipe } from 'effect';
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

  getBy(productId: number) {
    const getProductEffect = this.productRepository.getById(productId);
    const getStockEffect = this.productStockRepository.getById(productId);

    return pipe(
      Effect.zip(getProductEffect, getStockEffect),
      Effect.map(([product, stock]) =>
        SearchedProductInfo.from(product, stock),
      ),
      Effect.catchAll(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND)),
      ),
    );
  }

  deductStock(command: DeductStockCommand) {
    const productIds = command.orderItems.map((item) => item.productId);
    const findProductStocksEffect =
      this.productStockRepository.findByIdsWithXLock(
        productIds,
        command.transaction,
      );

    return pipe(
      findProductStocksEffect,
      Effect.flatMap((productStocks) => {
        const matchedItemAndStocks = command.orderItems.flatMap((item) => {
          const stock = productStocks.find(
            (s) => s.productId === item.productId,
          );
          return stock ? [{ item, stock }] : [];
        });

        return pipe(
          Effect.all(
            matchedItemAndStocks.map(({ item, stock }) =>
              stock.deductStock(item.quantity).pipe(
                Effect.map((updatedStock) => ({
                  productId: updatedStock.productId,
                  stock: updatedStock.stock,
                })),
              ),
            ),
          ),
          Effect.flatMap((updates) =>
            this.productStockRepository.updateBulk(
              updates,
              command.transaction,
            ),
          ),
        );
      }),
    );
  }
  // return Effect.gen(function* (this: ProductService) {
  //   const productStocks =
  //     yield* this.productStockRepository.findByIdsWithXLock(
  //       productIds,
  //       command.transaction,
  //     );

  //   const updates = yield* Effect.all(
  //     command.orderItems.map((orderItem) => {
  //       const stock = productStocks.find(
  //         (ps) => ps.productId === orderItem.productId,
  //       );

  //       if (!stock)
  //         return Effect.fail(
  //           new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND),
  //         );

  //       return stock.deductStock(orderItem.quantity).pipe(
  //         Effect.map((updatedStock) => ({
  //           productId: orderItem.productId,
  //           stock: updatedStock.stock,
  //         })),
  //       );
  //     }),
  //   );

  //   yield* this.productStockRepository.updateBulk(
  //     updates,
  //     command.transaction,
  //   );
  // });

  getPopularProducts(date: Date) {
    return pipe(
      this.popularProductRepository.findByAggregationDate(date),
      Effect.map(PopularProductInfo.fromList),
    );
  }
}
