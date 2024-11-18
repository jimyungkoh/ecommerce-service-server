import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductFacade } from 'src/application/facades';
import { QueryDateDto } from '../dtos/query-date.dto';

@ApiTags('/products')
@Controller('/products')
export class ProductController {
  constructor(private readonly productUseCase: ProductFacade) {}

  @Get('/:productId')
  getProducts(@Param('productId') productId: number) {
    return this.productUseCase.getProductById(productId);
  }

  @Get('/top')
  getPopularProducts(@Query() { date }: QueryDateDto) {
    return this.productUseCase.getPopularProducts(new Date(date));
  }
}
