import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { ProductModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class ProductRepository
  implements BaseRepository<Product, ProductModel>
{
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: Product,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductModel> {
    const prisma = transaction ?? this.prismaClient;
    const product = await prisma.product.create({ data });

    return ProductModel.from(product);
  }

  async update(
    id: number,
    data: Product,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductModel> {
    const prisma = transaction ?? this.prismaClient;
    const product = await prisma.product.update({ where: { id }, data });

    return ProductModel.from(product);
  }

  async delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = transaction ?? this.prismaClient;
    await prisma.product.delete({ where: { id } });
  }

  async findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductModel | null> {
    const prisma = transaction ?? this.prismaClient;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) return null;

    return ProductModel.from(product);
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductModel> {
    const prisma = transaction ?? this.prismaClient;
    const product = await prisma.product.findUniqueOrThrow({ where: { id } });

    return ProductModel.from(product);
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const products = await prisma.product.findMany();

    return products.map(ProductModel.from);
  }
}
