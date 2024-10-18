import { Injectable } from '@nestjs/common';
import { PopularProduct, Prisma } from '@prisma/client';
import { PopularProductDomain } from 'src/domain';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class PopularProductRepository
  implements BaseRepository<PopularProduct, PopularProductDomain>
{
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: PopularProduct,
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductDomain> {
    const prisma = transaction ?? this.prismaClient;
    const popularProduct = await prisma.popularProduct.create({ data });
    return new PopularProductDomain(
      popularProduct.id,
      popularProduct.productId,
      popularProduct.salesCount,
      popularProduct.aggregationDate,
      popularProduct.createdAt,
      popularProduct.updatedAt,
    );
  }

  async update(
    id: number,
    data: PopularProduct,
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductDomain> {
    const prisma = transaction ?? this.prismaClient;
    const popularProduct = await prisma.popularProduct.update({
      where: { id },
      data,
    });

    return new PopularProductDomain(
      popularProduct.id,
      popularProduct.productId,
      popularProduct.salesCount,
      popularProduct.aggregationDate,
      popularProduct.createdAt,
      popularProduct.updatedAt,
    );
  }

  async delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = transaction ?? this.prismaClient;
    await prisma.popularProduct.delete({ where: { id } });
  }

  async findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductDomain | null> {
    const prisma = transaction ?? this.prismaClient;
    const popularProduct = await prisma.popularProduct.findUnique({
      where: { id },
    });

    if (!popularProduct) return null;

    return new PopularProductDomain(
      popularProduct.id,
      popularProduct.productId,
      popularProduct.salesCount,
      popularProduct.aggregationDate,
      popularProduct.createdAt,
      popularProduct.updatedAt,
    );
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductDomain> {
    const prisma = transaction ?? this.prismaClient;

    const popularProduct = await prisma.popularProduct.findUniqueOrThrow({
      where: { id },
    });

    return new PopularProductDomain(
      popularProduct.id,
      popularProduct.productId,
      popularProduct.salesCount,
      popularProduct.aggregationDate,
      popularProduct.createdAt,
      popularProduct.updatedAt,
    );
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const pointList = await prisma.popularProduct.findMany();

    return pointList.map(
      (popularProduct) =>
        new PopularProductDomain(
          popularProduct.id,
          popularProduct.productId,
          popularProduct.salesCount,
          popularProduct.aggregationDate,
          popularProduct.createdAt,
          popularProduct.updatedAt,
        ),
    );
  }

  async findByProductId(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const pointList = await prisma.popularProduct.findMany({
      where: { productId },
    });

    return pointList.map(
      (popularProduct) =>
        new PopularProductDomain(
          popularProduct.id,
          popularProduct.productId,
          popularProduct.salesCount,
          popularProduct.aggregationDate,
          popularProduct.createdAt,
          popularProduct.updatedAt,
        ),
    );
  }

  async findByAggregationDate(
    aggregationDate: Date,
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const pointList = await prisma.popularProduct.findMany({
      where: { aggregationDate },
    });

    return pointList.map(
      (popularProduct) =>
        new PopularProductDomain(
          popularProduct.id,
          popularProduct.productId,
          popularProduct.salesCount,
          popularProduct.aggregationDate,
          popularProduct.createdAt,
          popularProduct.updatedAt,
        ),
    );
  }
}
