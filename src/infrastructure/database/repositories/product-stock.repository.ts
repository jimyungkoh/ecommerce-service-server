import { Injectable } from '@nestjs/common';
import { Prisma, ProductStock } from '@prisma/client';
import { ProductStockModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class ProductStockRepository
  implements BaseRepository<ProductStock, ProductStockModel>
{
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: ProductStock,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductStockModel> {
    const prisma = transaction ?? this.prismaClient;
    const productStock = await prisma.productStock.create({ data });

    return ProductStockModel.from(productStock);
  }

  async update(
    productId: number,
    data: Prisma.ProductStockUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductStockModel> {
    const prisma = transaction ?? this.prismaClient;

    const updatedProductStock = await prisma.productStock.update({
      where: { productId },
      data,
    });

    return ProductStockModel.from(updatedProductStock);
  }

  async updateBulk(
    updates: { productId: number; stock: number }[],
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = transaction ?? this.prismaClient;

    // 벌크 업데이트를 위한 values 문자열 생성
    const values = updates
      .map((update) => `(${update.productId}, ${update.stock})`)
      .join(', ');

    await prisma.$executeRaw`
      UPDATE product_stock ps
      SET stock = t.stock
      FROM (VALUES ${Prisma.raw(values)}) AS t(product_id, stock)
      WHERE ps.product_id = t.product_id
    `;
  }

  async delete(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = transaction ?? this.prismaClient;
    await prisma.productStock.delete({ where: { productId } });
  }

  async findById(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductStockModel | null> {
    const prisma = transaction ?? this.prismaClient;
    const product = await prisma.productStock.findUnique({
      where: { productId },
    });

    if (!product) return null;

    return ProductStockModel.from(product);
  }

  async getById(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductStockModel> {
    const prisma = transaction ?? this.prismaClient;

    const product = await prisma.productStock.findUniqueOrThrow({
      where: { productId },
    });

    return ProductStockModel.from(product);
  }

  async getByIdWithXLock(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductStockModel> {
    const prisma = transaction ?? this.prismaClient;

    const [product] = await prisma.$queryRaw<ProductStock[]>`
      SELECT product_id as "productId", stock,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM "product_stock"
      WHERE product_id = ${productId}
      FOR UPDATE`;

    if (!product) throw new Error('Product not found');

    return ProductStockModel.from(product);
  }

  // 여러 상품 재고 한번에 조회
  async getByIdsWithXLock(
    productIds: number[],
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductStockModel[]> {
    const prisma = transaction ?? this.prismaClient;

    const stocks = await prisma.$queryRaw<ProductStock[]>`
      SELECT product_id as "productId", stock,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM "product_stock" 
      WHERE product_id = ANY(${productIds}::bigint[])
      FOR UPDATE`;

    if (stocks.length !== productIds.length) {
      throw new Error('Product not found');
    }

    return stocks.map(ProductStockModel.from);
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductStockModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const productStockList = await prisma.productStock.findMany();

    return productStockList.map(ProductStockModel.from);
  }
}
