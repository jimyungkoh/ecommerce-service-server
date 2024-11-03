import { Injectable } from '@nestjs/common';
import { PopularProduct, Prisma } from '@prisma/client';
import { PopularProductModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class PopularProductRepository
  implements BaseRepository<PopularProduct, PopularProductModel>
{
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: PopularProduct,
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductModel> {
    const prisma = transaction ?? this.prismaClient;
    const popularProduct = await prisma.popularProduct.create({ data });
    return PopularProductModel.from(popularProduct);
  }

  async update(
    id: number,
    data: PopularProduct,
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductModel> {
    const prisma = transaction ?? this.prismaClient;
    const popularProduct = await prisma.popularProduct.update({
      where: { id },
      data,
    });

    return PopularProductModel.from(popularProduct);
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
  ): Promise<PopularProductModel | null> {
    const prisma = transaction ?? this.prismaClient;
    const popularProduct = await prisma.popularProduct.findUnique({
      where: { id },
    });

    if (!popularProduct) return null;

    return PopularProductModel.from(popularProduct);
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductModel> {
    const prisma = transaction ?? this.prismaClient;

    const popularProduct = await prisma.popularProduct.findUniqueOrThrow({
      where: { id },
    });

    return PopularProductModel.from(popularProduct);
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const pointList = await prisma.popularProduct.findMany();

    return pointList.map(PopularProductModel.from);
  }

  async findByProductId(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const pointList = await prisma.popularProduct.findMany({
      where: { productId },
    });

    return pointList.map(PopularProductModel.from);
  }

  async findByAggregationDate(
    aggregationDate: Date,
    transaction?: Prisma.TransactionClient,
  ): Promise<PopularProductModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const pointList = await prisma.popularProduct.findMany({
      where: { aggregationDate },
    });

    return pointList
      .sort((a, b) => (a.salesCount > b.salesCount ? 1 : -1))
      .map(PopularProductModel.from);
  }
}
