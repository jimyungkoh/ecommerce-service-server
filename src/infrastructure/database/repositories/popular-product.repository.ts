import { Injectable } from '@nestjs/common';
import { PopularProduct, Prisma } from '@prisma/client';
import { PopularProductDomain } from 'src/infrastructure/dtos/domains';
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
    return PopularProductDomain.from(popularProduct);
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

    return PopularProductDomain.from(popularProduct);
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

    return PopularProductDomain.from(popularProduct);
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductDomain> {
    const prisma = transaction ?? this.prismaClient;

    const popularProduct = await prisma.popularProduct.findUniqueOrThrow({
      where: { id },
    });

    return PopularProductDomain.from(popularProduct);
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const pointList = await prisma.popularProduct.findMany();

    return pointList.map(PopularProductDomain.from);
  }

  async findByProductId(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const pointList = await prisma.popularProduct.findMany({
      where: { productId },
    });

    return pointList.map(PopularProductDomain.from);
  }

  async findByAggregationDate(
    aggregationDate: Date,
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const pointList = await prisma.popularProduct.findMany({
      where: { aggregationDate },
    });

    return pointList
      .sort((a, b) => (a.salesCount > b.salesCount ? 1 : -1))
      .map(PopularProductDomain.from);
  }
}
