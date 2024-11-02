import { Injectable } from '@nestjs/common';
import { ProductService } from 'src/domain/services';
@Injectable()
export class ProductFacade {
  constructor(private readonly productService: ProductService) {}

  async getProductById(id: number) {
    return await this.productService.getBy(id);
  }

  async getPopularProducts(date: Date) {
    return await this.productService.getPopularProducts(date);
  }
}
