import { Injectable } from '@nestjs/common';
import { PopularProduct, Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import { AppNotFoundException } from 'src/domain/exceptions';
import { PopularProductModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class PopularProductRepository
  implements BaseRepository<PopularProduct, PopularProductModel>
{
  constructor(private readonly prismaClient: PrismaService) {}

  create(
    data: PopularProduct,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PopularProductModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const popularProductPromise = Effect.tryPromise(() =>
      prisma.popularProduct.create({ data }),
    );

    return pipe(popularProductPromise, Effect.map(PopularProductModel.from));
  }

  update(
    id: number,
    data: PopularProduct,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PopularProductModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const popularProductPromise = Effect.tryPromise(() =>
      prisma.popularProduct.update({
        where: { id },
        data,
      }),
    );

    return pipe(popularProductPromise, Effect.map(PopularProductModel.from));
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const deletePromise = Effect.tryPromise(() =>
      prisma.popularProduct.delete({ where: { id } }),
    );

    return pipe(
      deletePromise,
      Effect.map(() => void 0),
    );
  }

  findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PopularProductModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;
    const popularProductPromise = Effect.tryPromise(() =>
      prisma.popularProduct.findUnique({
        where: { id },
      }),
    );

    return pipe(
      popularProductPromise,
      Effect.map((product) =>
        product ? PopularProductModel.from(product) : null,
      ),
    );
  }

  getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PopularProductModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const popularProductPromise = Effect.tryPromise(() =>
      prisma.popularProduct.findUniqueOrThrow({
        where: { id },
      }),
    );

    return pipe(
      popularProductPromise,
      Effect.map(PopularProductModel.from),
      Effect.catchAll(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND)),
      ),
    );
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PopularProductModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const popularProductListPromise = Effect.tryPromise(() =>
      prisma.popularProduct.findMany(),
    );

    return pipe(
      popularProductListPromise,
      Effect.map((popularProducts) =>
        popularProducts.map(PopularProductModel.from),
      ),
    );
  }

  findByProductId(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PopularProductModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const popularProductListPromise = Effect.tryPromise(() =>
      prisma.popularProduct.findMany({
        where: { productId },
      }),
    );

    return pipe(
      popularProductListPromise,
      Effect.map((popularProducts) =>
        popularProducts.map(PopularProductModel.from),
      ),
    );
  }

  findByAggregationDate(
    aggregationDate: Date,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PopularProductModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const popularProductListPromise = Effect.tryPromise(() =>
      prisma.popularProduct.findMany({
        where: { aggregationDate },
      }),
    );

    return pipe(
      popularProductListPromise,
      Effect.map((popularProducts) =>
        popularProducts
          .sort((a, b) => (a.salesCount > b.salesCount ? 1 : -1))
          .map(PopularProductModel.from),
      ),
    );
  }
}
