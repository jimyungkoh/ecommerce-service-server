import { Injectable } from '@nestjs/common';
import { Prisma, ProductStock } from '@prisma/client';
import { ProductStockDomain } from 'src/infrastructure/dtos/domains';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class ProductStockRepository
  implements BaseRepository<ProductStock, ProductStockDomain>
{
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: ProductStock,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductStockDomain> {
    const prisma = transaction ?? this.prismaClient;
    const productStock = await prisma.productStock.create({ data });

    return new ProductStockDomain({
      productId: productStock.productId,
      stock: productStock.stock,
      createdAt: productStock.createdAt,
      updatedAt: productStock.updatedAt,
    });
  }

  async update(
    productId: bigint,
    data: Prisma.ProductStockUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductStockDomain> {
    const prisma = transaction ?? this.prismaClient;

    const updatedProductStock = await prisma.productStock.update({
      where: { productId },
      data,
    });

    return new ProductStockDomain({
      productId: updatedProductStock.productId,
      stock: updatedProductStock.stock,
      createdAt: updatedProductStock.createdAt,
      updatedAt: updatedProductStock.updatedAt,
    });
  }

  async updateBulk(
    updates: { productId: bigint; stock: number }[],
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
    productId: bigint,
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = transaction ?? this.prismaClient;
    await prisma.productStock.delete({ where: { productId } });
  }

  async findById(
    productId: bigint,
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductStockDomain | null> {
    const prisma = transaction ?? this.prismaClient;
    const product = await prisma.productStock.findUnique({
      where: { productId },
    });

    if (!product) return null;

    return new ProductStockDomain({
      productId: product.productId,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }

  async getById(
    productId: bigint,
    transaction?: Prisma.TransactionClient,
    xLock?: boolean,
  ): Promise<ProductStockDomain> {
    const prisma = transaction ?? this.prismaClient;

    let product: ProductStock;

    if (xLock) {
      const [lockedProduct] = await prisma.$queryRaw<ProductStock[]>`
      SELECT product_id as "productId", stock,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM "product_stock"
      WHERE product_id = ${productId}
      FOR UPDATE`;

      if (!lockedProduct) throw new Error('Product not found');
      product = lockedProduct;
    } else {
      product = await prisma.productStock.findUniqueOrThrow({
        where: { productId },
      });
    }

    return new ProductStockDomain({
      productId: product.productId,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }

  // 여러 상품 재고 한번에 조회
  async getByIds(
    productIds: bigint[],
    transaction?: Prisma.TransactionClient,
    forUpdate = false,
  ): Promise<ProductStockDomain[]> {
    const prisma = transaction ?? this.prismaClient;

    let stocks: ProductStock[];
    if (forUpdate) {
      stocks = await prisma.$queryRaw<ProductStock[]>`
        SELECT product_id as "productId", stock,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM "product_stock" 
        WHERE product_id = ANY(${productIds}::bigint[])
        FOR UPDATE`;
    } else {
      stocks = await prisma.productStock.findMany({
        where: {
          productId: {
            in: productIds,
          },
        },
      });
    }

    if (stocks.length !== productIds.length) {
      throw new Error('Product not found');
    }

    return stocks.map((stock) => new ProductStockDomain(stock));
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<ProductStockDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const productStockList = await prisma.productStock.findMany();

    return productStockList.map(
      (productStock) =>
        new ProductStockDomain({
          productId: productStock.productId,
          stock: productStock.stock,
          createdAt: productStock.createdAt,
          updatedAt: productStock.updatedAt,
        }),
    );
  }
}
