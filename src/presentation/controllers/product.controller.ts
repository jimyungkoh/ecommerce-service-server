import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Effect, pipe } from 'effect';
import { ProductFacade } from 'src/application/facades';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { QueryDateRequestDto } from '../dtos/product/request';

@ApiTags('/products')
@Controller('/products')
export class ProductController {
  constructor(
    private readonly productUseCase: ProductFacade,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  @Get('/:productId')
  getProducts(@Param('productId') productId: number) {
    return this.productUseCase.getProductById(productId);
  }

  @Get('/top')
  getPopularProducts(@Query() { date }: QueryDateRequestDto) {
    return this.productUseCase.getPopularProducts(new Date(date));
  }
}
