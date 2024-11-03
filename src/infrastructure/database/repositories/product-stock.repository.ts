import { Injectable } from '@nestjs/common';
import { Prisma, ProductStock } from '@prisma/client';
import { Effect } from 'effect';
import { ProductStockModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class ProductStockRepository
  implements BaseRepository<ProductStock, ProductStockModel>
{
  constructor(private readonly prismaClient: PrismaService) {}

  create(
    data: ProductStock,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductStockModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const productStockPromise = prisma.productStock.create({ data });

    return Effect.promise(() => productStockPromise).pipe(
      Effect.map(ProductStockModel.from),
    );
  }

  update(
    productId: number,
    data: Prisma.ProductStockUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductStockModel, Error> {
    const prisma = transaction ?? this.prismaClient;

    const updatedProductStockPromise = prisma.productStock.update({
      where: { productId },
      data,
    });

    return Effect.promise(() => updatedProductStockPromise).pipe(
      Effect.map(ProductStockModel.from),
    );
  }

  updateBulk(
    updates: { productId: number; stock: number }[],
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;

    // 벌크 업데이트를 위한 values 문자열 생성
    const values = updates
      .map((update) => `(${update.productId}, ${update.stock})`)
      .join(', ');

    const productStockPromise = prisma.$executeRaw`
      UPDATE product_stock ps
      SET stock = t.stock
      FROM (VALUES ${Prisma.raw(values)}) AS t(product_id, stock)
      WHERE ps.product_id = t.product_id
    `;

    return Effect.promise(() => productStockPromise);
  }

  delete(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const productStockPromise = prisma.productStock.delete({
      where: { productId },
    });

    return Effect.promise(() => productStockPromise);
  }

  findById(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductStockModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;
    const productStockPromise = prisma.productStock.findUnique({
      where: { productId },
    });

    return Effect.promise(() => productStockPromise).pipe(
      Effect.map((productStock) =>
        productStock ? ProductStockModel.from(productStock) : null,
      ),
    );
  }

  getById(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductStockModel, Error> {
    const prisma = transaction ?? this.prismaClient;

    const productStockPromise = prisma.productStock.findUniqueOrThrow({
      where: { productId },
    });

    return Effect.promise(() => productStockPromise).pipe(
      Effect.map(ProductStockModel.from),
    );
  }

  getByIdWithXLock(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductStockModel, Error> {
    const prisma = transaction ?? this.prismaClient;

    const stocksPromise = Effect.tryPromise({
      try: () => prisma.$queryRaw<ProductStock[]>`
          SELECT product_id as "productId", stock,
              created_at as "createdAt",
              updated_at as "updatedAt"
            FROM "product_stock" 
          WHERE product_id = ANY(${productId}::bigint)
          FOR UPDATE`,
      catch: (error) => error as Error,
    });

    return Effect.gen(function* () {
      const stocks = yield* stocksPromise;

      if (stocks.length === 0) {
        return yield* Effect.fail(new Error());
      }

      return ProductStockModel.from(stocks[0]);
    });
  }

  getByIdsWithXLock(
    productIds: number[],
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductStockModel[], Error> {
    const prisma = transaction ?? this.prismaClient;

    const stocksPromise = prisma.$queryRaw<ProductStock[]>`
      SELECT product_id as "productId", stock,
            created_at as "createdAt", 
            updated_at as "updatedAt"
      FROM "product_stock"
      WHERE product_id = ANY(${productIds}::bigint[])
      FOR UPDATE`;

    return Effect.gen(function* () {
      const stocks = yield* Effect.tryPromise({
        try: () => stocksPromise,
        catch: (error) => error as Error,
      });

      return stocks.length === 0
        ? yield* Effect.fail(new Error())
        : stocks.map(ProductStockModel.from);
    });
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductStockModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const productStockListPromise = prisma.productStock.findMany();

    return Effect.promise(() => productStockListPromise).pipe(
      Effect.map((productStockList) =>
        productStockList.map(ProductStockModel.from),
      ),
    );
  }
}
