import { Injectable } from '@nestjs/common';
import { PopularProduct, Prisma } from '@prisma/client';
import { Effect } from 'effect';
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
    const popularProductPromise = prisma.popularProduct.create({ data });

    return Effect.promise(() => popularProductPromise).pipe(
      Effect.map(PopularProductModel.from),
    );
  }

  update(
    id: number,
    data: PopularProduct,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PopularProductModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const popularProductPromise = prisma.popularProduct.update({
      where: { id },
      data,
    });

    return Effect.promise(() => popularProductPromise).pipe(
      Effect.map(PopularProductModel.from),
    );
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const deletePromise = prisma.popularProduct.delete({ where: { id } });

    return Effect.promise(() => deletePromise);
  }

  findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PopularProductModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;
    const popularProductPromise = prisma.popularProduct.findUnique({
      where: { id },
    });

    return Effect.promise(() => popularProductPromise).pipe(
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

    const popularProductPromise = prisma.popularProduct.findUniqueOrThrow({
      where: { id },
    });

    return Effect.promise(() => popularProductPromise).pipe(
      Effect.map(PopularProductModel.from),
    );
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PopularProductModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const popularProductListPromise = prisma.popularProduct.findMany();

    return Effect.promise(() => popularProductListPromise).pipe(
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
    const popularProductListPromise = prisma.popularProduct.findMany({
      where: { productId },
    });

    return Effect.promise(() => popularProductListPromise).pipe(
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
    const popularProductListPromise = prisma.popularProduct.findMany({
      where: { aggregationDate },
    });

    return Effect.promise(() => popularProductListPromise).pipe(
      Effect.map((popularProducts) =>
        popularProducts
          .sort((a, b) => (a.salesCount > b.salesCount ? 1 : -1))
          .map(PopularProductModel.from),
      ),
    );
  }
}
