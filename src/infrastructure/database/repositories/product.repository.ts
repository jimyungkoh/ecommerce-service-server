import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { Effect } from 'effect';
import { ProductModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class ProductRepository
  implements BaseRepository<Product, ProductModel>
{
  constructor(private readonly prismaClient: PrismaService) {}

  create(
    data: Product,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductModel, Error> {
    const prisma = transaction ?? this.prismaClient;

    const productPromise = prisma.product.create({ data });

    return Effect.promise(() => productPromise).pipe(
      Effect.map(ProductModel.from),
    );
  }

  update(
    id: number,
    data: Product,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const productPromise = prisma.product.update({ where: { id }, data });

    return Effect.promise(() => productPromise).pipe(
      Effect.map(ProductModel.from),
    );
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    return Effect.promise(() => prisma.product.delete({ where: { id } }));
  }

  findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;
    const productPromise = prisma.product.findUnique({ where: { id } });

    return Effect.promise(() => productPromise).pipe(
      Effect.map((product) => (product ? ProductModel.from(product) : null)),
    );
  }

  getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const productPromise = prisma.product.findUniqueOrThrow({ where: { id } });

    return Effect.promise(() => productPromise).pipe(
      Effect.map(ProductModel.from),
    );
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<ProductModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const productsPromise = prisma.product.findMany();

    return Effect.promise(() => productsPromise).pipe(
      Effect.map((products) => products.map(ProductModel.from)),
    );
  }
}
