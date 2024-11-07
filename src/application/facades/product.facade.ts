import { Injectable } from '@nestjs/common';
import { ProductService } from 'src/domain/services';
@Injectable()
export class ProductFacade {
  constructor(private readonly productService: ProductService) {}

  getProductById(id: number) {
    return this.productService.getBy(id);
  }

  getPopularProducts(date: Date) {
    return this.productService.getPopularProducts(date);
  }
}
