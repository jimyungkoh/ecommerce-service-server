import { Inject } from '@nestjs/common';
import { Prisma, ProductStock } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import {
  AppConflictException,
  AppNotFoundException,
} from 'src/domain/exceptions';
import { ProductStockModel } from 'src/domain/models';
import { Infrastructure } from '../../../common/decorators';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Infrastructure()
export class ProductStockRepository
  implements BaseRepository<ProductStock, ProductStockModel>
{
  constructor(
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    private readonly prismaClient: PrismaService,
  ) {}

  create(
    data: ProductStock,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductStockModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const productStockPromise = Effect.tryPromise(() =>
      prisma.productStock.create({ data }),
    );

    return pipe(productStockPromise, Effect.map(ProductStockModel.from));
  }

  update(
    productId: number,
    data: Prisma.ProductStockUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductStockModel, Error> {
    const prisma = transaction ?? this.prismaClient;

    const updatedProductStockPromise = Effect.tryPromise(() =>
      prisma.productStock.update({
        where: { productId },
        data,
      }),
    );

    return pipe(updatedProductStockPromise, Effect.map(ProductStockModel.from));
  }

  updateBulk(
    updates: { productId: number; stock: number }[],
    transaction?: Prisma.TransactionClient,
  ) {
    const prisma = transaction ?? this.prismaClient;

    const productStockPromise = Effect.all(
      updates.map((update) =>
        Effect.tryPromise(() =>
          prisma.productStock.updateMany({
            where: { productId: update.productId },
            data: { stock: update.stock },
          }),
        ),
      ),
    );

    return pipe(
      productStockPromise,
      Effect.map(() => void 0),
      Effect.catchAll(() => {
        return Effect.fail(new AppConflictException(ErrorCodes.ORDER_FAILED));
      }),
    );
  }

  compensate(updates: { productId: number; stock: number }[]) {
    return this.updateBulk(updates);
  }

  delete(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const productStockPromise = Effect.tryPromise(() =>
      prisma.productStock.delete({
        where: { productId },
      }),
    );
    return pipe(
      productStockPromise,
      Effect.map(() => void 0),
    );
  }

  findOneBy(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductStockModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;
    const productStockPromise = Effect.tryPromise(() =>
      prisma.productStock.findUnique({
        where: { productId },
      }),
    );

    return pipe(
      productStockPromise,
      Effect.map((productStock) =>
        productStock ? ProductStockModel.from(productStock) : null,
      ),
    );
  }

  getById(
    productId: number,
  ): Effect.Effect<ProductStockModel, AppNotFoundException> {
    const productStockPromise = Effect.tryPromise(() =>
      this.prismaClient.productStock.findUniqueOrThrow({
        where: { productId },
      }),
    );

    return pipe(
      productStockPromise,
      Effect.map(ProductStockModel.from),
      Effect.catchAll(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND)),
      ),
    );
  }

  getByIdWithXLock(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductStockModel, AppNotFoundException | Error> {
    const prisma = transaction ?? this.prismaClient;

    const stocksPromise = Effect.tryPromise(
      () => prisma.$queryRaw<ProductStock[]>`
          SELECT product_id as productId, stock,
                created_at as createdAt,
                updated_at as updatedAt
          FROM product_stock
          WHERE product_id = ${productId}
          FOR UPDATE`,
    );

    return pipe(
      stocksPromise,
      Effect.flatMap((stocks) =>
        stocks.length === 0
          ? Effect.fail(new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND))
          : Effect.succeed(ProductStockModel.from(stocks[0])),
      ),
      Effect.catchAll(() =>
        Effect.fail(new AppConflictException(ErrorCodes.ORDER_FAILED)),
      ),
    );
  }

  findByIdsWithXLock(
    productIds: number[],
    transaction: Prisma.TransactionClient,
  ) {
    const stocksPromise = Effect.tryPromise(
      () => transaction.$queryRaw<ProductStock[]>`
        SELECT product_id as productId, stock,
              created_at as createdAt,
              updated_at as updatedAt
        FROM product_stock
        WHERE product_id IN (${Prisma.join(productIds)})
        FOR UPDATE`,
    );

    return pipe(
      stocksPromise,
      Effect.map((stocks) =>
        stocks.length > 0 ? stocks.map(ProductStockModel.from) : [],
      ),
      Effect.catchAll(() => {
        return Effect.fail(new AppConflictException(ErrorCodes.ORDER_FAILED));
      }),
    );
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductStockModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const productStockListPromise = Effect.tryPromise(() =>
      prisma.productStock.findMany(),
    );

    return pipe(
      productStockListPromise,
      Effect.map((productStockList) =>
        productStockList.map(ProductStockModel.from),
      ),
    );
  }
}
