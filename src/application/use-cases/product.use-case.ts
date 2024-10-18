import { Injectable } from '@nestjs/common';
import { ProductService } from '../services';

@Injectable()
export class ProductUseCase {
  constructor(private readonly productManager: ProductService) {}

  async getProductById(id: bigint) {
    return await this.productManager.getBy(id);
  }

  async getPopularProducts(date: Date) {
    return await this.productManager.getPopularProducts(date);
  }
}
