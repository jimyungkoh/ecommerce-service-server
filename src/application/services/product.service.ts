import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  OrderItemDomain,
  PopularProductDomain,
  SearchedProductDomain,
} from 'src/domain';
import {
  ProductRepository,
  ProductStockRepository,
} from 'src/infrastructure/database/repositories';
import { PopularProductRepository } from 'src/infrastructure/database/repositories/popular-product.repository';
import { ProductNotFoundException } from '../exceptions/product-not-found.exception';
import { ProductOutOfStockException } from '../exceptions/product-out-of-stock.exception';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productStockRepository: ProductStockRepository,
    private readonly popularProductRepository: PopularProductRepository,
  ) {}

  async getBy(productId: bigint): Promise<SearchedProductDomain> {
    try {
      const [product, stock] = await Promise.all([
        this.productRepository.getById(productId),
        this.productStockRepository.getById(productId),
      ]);

      return new SearchedProductDomain(
        product.id,
        product.name,
        product.price,
        stock.stock,
      );
    } catch (error) {
      throw new ProductNotFoundException();
    }
  }

  async deductStock(
    orderItems: OrderItemDomain[],
    transaction: Prisma.TransactionClient,
  ): Promise<void> {
    for (const orderItem of orderItems) {
      const productStock = await this.productStockRepository
        .getById(orderItem.productId, transaction, true)
        .catch(() => {
          throw new ProductNotFoundException();
        });

      if (!productStock.inStock(orderItem.quantity))
        throw new ProductOutOfStockException();

      await this.productStockRepository.update(
        orderItem.productId,
        {
          stock: productStock.stock - orderItem.quantity,
        },
        transaction,
      );
    }
  }

  async getPopularProducts(date: Date): Promise<PopularProductDomain[]> {
    return await this.popularProductRepository.findByAggregationDate(date);
  }
}
