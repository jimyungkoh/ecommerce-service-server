import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductFacade } from 'src/application/facades';
import { SearchedProductInfo } from 'src/domain/dtos/info';
import { PopularProductInfo } from 'src/domain/dtos/info/product/popular-product.info';
import { QueryDateDto } from '../dtos/query-date.dto';

@ApiTags('/products')
@Controller('/products')
export class ProductController {
  constructor(private readonly productUseCase: ProductFacade) {}

  @Get('/:productId')
  async getProducts(
    @Param('productId')
    productId: bigint,
  ): Promise<SearchedProductInfo> {
    return this.productUseCase.getProductById(productId);
  }

  @Get('/top')
  async getPopularProducts(
    @Query() { date }: QueryDateDto,
  ): Promise<PopularProductInfo[]> {
    return this.productUseCase.getPopularProducts(new Date(date));
  }
}
