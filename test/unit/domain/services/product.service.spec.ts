import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ErrorCodes } from 'src/common/errors';
import { AppNotFoundException } from 'src/domain/exceptions';
import { ProductService } from 'src/domain/services';
import {
  ProductRepository,
  ProductStockRepository,
} from 'src/infrastructure/database/repositories';
import { PopularProductRepository } from 'src/infrastructure/database/repositories/popular-product.repository';
import { productServiceFixture } from './helpers/product.service.fixture';

describe('ProductService', () => {
  let productService: ProductService;
  let productRepository: DeepMockProxy<ProductRepository>;
  let productStockRepository: DeepMockProxy<ProductStockRepository>;
  let popularProductRepository: DeepMockProxy<PopularProductRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: ProductRepository,
          useFactory: () => mockDeep<ProductRepository>(),
        },
        {
          provide: ProductStockRepository,
          useFactory: () => mockDeep<ProductStockRepository>(),
        },
        {
          provide: PopularProductRepository,
          useFactory: () => mockDeep<PopularProductRepository>(),
        },
      ],
    }).compile();

    productService = module.get(ProductService);
    productRepository = module.get(ProductRepository);
    productStockRepository = module.get(ProductStockRepository);
    popularProductRepository = module.get(PopularProductRepository);
  });

  describe('getById', () => {
    it('제품이 발견되면 제품을 반환해야 합니다', async () => {
      // given
      const { productId, product, stock, searchResult } =
        productServiceFixture();

      productRepository.getById.mockResolvedValue(product);
      productStockRepository.getById.mockResolvedValue(stock);

      // when
      const result = await productService.getBy(productId);

      // then
      expect(result).toEqual(searchResult);
    });

    it('제품을 찾을 수 없을 때 ProductNotFoundException을 던져야 합니다', async () => {
      // given
      const { productId } = productServiceFixture();
      productRepository.getById.mockRejectedValue(
        new Error('Product not found'),
      );
      productStockRepository.getById.mockRejectedValue(
        new Error('Stock not found'),
      );

      // when & then
      await expect(productService.getBy(productId)).rejects.toThrow(
        new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND),
      );
    });
    it('재고를 찾을 수 없을 때 ProductNotFoundException을 던져야 합니다', async () => {
      // given
      const { productId, product } = productServiceFixture();
      productRepository.getById.mockResolvedValue(product);
      productStockRepository.getById.mockRejectedValue(
        new Error('Stock not found'),
      );

      // when & then
      await expect(productService.getBy(productId)).rejects.toThrow(
        new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND),
      );
    });
  });
});
