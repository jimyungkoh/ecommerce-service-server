import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { ProductDomain } from 'src/infrastructure/dtos/domains';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class ProductRepository
  implements BaseRepository<Product, ProductDomain>
{
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: Product,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductDomain> {
    const prisma = transaction ?? this.prismaClient;
    const product = await prisma.product.create({ data });

    return new ProductDomain({
      id: product.id,
      name: product.name,
      price: product.price,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }

  async update(
    id: bigint,
    data: Product,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductDomain> {
    const prisma = transaction ?? this.prismaClient;
    const product = await prisma.product.update({ where: { id }, data });

    return new ProductDomain({
      id: product.id,
      name: product.name,
      price: product.price,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }

  async delete(
    id: bigint,
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = transaction ?? this.prismaClient;
    await prisma.product.delete({ where: { id } });
  }

  async findById(
    id: bigint,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductDomain | null> {
    const prisma = transaction ?? this.prismaClient;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) return null;

    return new ProductDomain({
      id: product.id,
      name: product.name,
      price: product.price,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }

  async getById(
    id: bigint,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductDomain> {
    const prisma = transaction ?? this.prismaClient;
    const product = await prisma.product.findUniqueOrThrow({ where: { id } });

    return new ProductDomain({
      id: product.id,
      name: product.name,
      price: product.price,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const products = await prisma.product.findMany();

    return products.map(
      (product) =>
        new ProductDomain({
          id: product.id,
          name: product.name,
          price: product.price,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        }),
    );
  }
}
