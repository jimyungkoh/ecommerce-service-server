import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Effect } from 'effect';
import { ProductFacade } from 'src/application/facades';
import { QueryDateDto } from '../dtos/query-date.dto';

@ApiTags('/products')
@Controller('/products')
export class ProductController {
  constructor(private readonly productUseCase: ProductFacade) {}

  @Get('/:productId')
  async getProducts(@Param('productId') productId: number) {
    return await Effect.runPromise(
      this.productUseCase.getProductById(productId),
    );
  }

  @Get('/top')
  async getPopularProducts(@Query() { date }: QueryDateDto) {
    return await Effect.runPromise(
      this.productUseCase.getPopularProducts(new Date(date)),
    );
  }
}
