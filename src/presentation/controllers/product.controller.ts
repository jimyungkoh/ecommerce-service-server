import { TypedException, TypedRoute } from '@nestia/core';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductNotFoundException } from 'src/application/exceptions';
import { ProductFacade } from 'src/application/facades';
import { ErrorCode } from 'src/common/errors';
import { PopularProductDomain, SearchedProductDomain } from 'src/domain';
import { QueryDateDto } from '../dto/query-date.dto';

/**
 * @Controller('products')
 * 제품 관련 요청을 처리하는 컨트롤러 클래스입니다.
 */
/**
 * 제품 관련 컨트롤러 클래스입니다.
 */
@ApiTags('products')
@Controller('products')
export class ProductController {
  /**
   * @constructor
   * @param {ProductFacade} productUseCase - 제품 관련 비즈니스 로직을 처리하는 유스케이스 인스턴스입니다.
   */
  constructor(private readonly productUseCase: ProductFacade) {}

  /**
   * 특정 제품 ID로 제품 정보를 가져옵니다.
   * @param {bigint} productId - 조회할 제품의 ID입니다.
   * @returns {Promise<SearchedProductDomain>} 제품 정보가 담긴 Promise 객체를 반환합니다.
   */
  @TypedRoute.Get(':productId')
  @TypedException<ProductNotFoundException>({
    status: ErrorCode.PRODUCT_NOT_FOUND.status,
    description: ErrorCode.PRODUCT_NOT_FOUND.message,
  })
  @Get(':productId')
  async getProducts(
    @Param('productId')
    productId: bigint,
  ): Promise<SearchedProductDomain> {
    return this.productUseCase.getProductById(productId);
  }

  /**
   * 인기 있는 제품 목록을 가져옵니다.
   * @param {QueryDateDto} date - 조회할 날짜 정보가 담긴 DTO입니다.
   * @returns {Promise<PopularProductDomain[]>} 인기 제품 목록이 담긴 Promise 객체를 반환합니다.
   */
  @TypedRoute.Get('top')
  @Get('top')
  async getPopularProducts(
    @Query() { date }: QueryDateDto,
  ): Promise<PopularProductDomain[]> {
    return this.productUseCase.getPopularProducts(new Date(date));
  }
}
