import { Inject, Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { AppNotFoundException } from 'src/domain/exceptions';
import { ProductModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class ProductRepository
  implements BaseRepository<Product, ProductModel>
{
  constructor(
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    private readonly prismaClient: PrismaService,
  ) {}

  create(
    data: Product,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductModel, Error> {
    const prisma = transaction ?? this.prismaClient;

    const productPromise = Effect.tryPromise(() =>
      prisma.product.create({ data }),
    );

    return pipe(productPromise, Effect.map(ProductModel.from));
  }

  update(
    id: number,
    data: Product,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const productPromise = Effect.tryPromise(() =>
      prisma.product.update({ where: { id }, data }),
    );

    return pipe(productPromise, Effect.map(ProductModel.from));
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const productPromise = Effect.tryPromise(() =>
      prisma.product.delete({ where: { id } }),
    );

    return pipe(
      productPromise,
      Effect.map(() => void 0),
    );
  }

  findOneBy(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;
    const productPromise = Effect.tryPromise(() =>
      prisma.product.findUnique({ where: { id } }),
    );

    return pipe(
      productPromise,
      Effect.map((product) => (product ? ProductModel.from(product) : null)),
    );
  }

  getById(id: number): Effect.Effect<ProductModel, AppNotFoundException> {
    const productPromise = Effect.tryPromise(() =>
      this.prismaClient.product.findUniqueOrThrow({ where: { id } }),
    );

    return pipe(
      productPromise,
      Effect.map(ProductModel.from),
      Effect.catchAll(() => {
        return Effect.fail(
          new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND),
        );
      }),
    );
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const productsPromise = Effect.tryPromise(() => prisma.product.findMany());

    return pipe(
      productsPromise,
      Effect.map((products) => products.map(ProductModel.from)),
    );
  }
}
