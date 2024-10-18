import { Test, TestingModule } from '@nestjs/testing';
import Decimal from 'decimal.js';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ProductNotFoundException } from 'src/application/exceptions/product-not-found.exception';
import { ProductService } from 'src/application/services';
import {
  ProductDomain,
  ProductStockDomain,
  SearchedProductDomain,
} from 'src/domain';
import {
  ProductRepository,
  ProductStockRepository,
} from 'src/infrastructure/database/repositories';
import { PopularProductRepository } from 'src/infrastructure/database/repositories/popular-product.repository';

describe('ProductService', () => {
  let productService: ProductService;
  let productRepository: DeepMockProxy<ProductRepository>;
  let productStockRepository: DeepMockProxy<ProductStockRepository>;

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

    productService = module.get<ProductService>(ProductService);
    productRepository = module.get(ProductRepository);
    productStockRepository = module.get(ProductStockRepository);
  });

  describe('getById', () => {
    it('제품이 발견되면 제품을 반환해야 합니다', async () => {
      // given
      const productId = BigInt(1);
      const product = new ProductDomain(
        productId,
        'Product 1',
        new Decimal(100_000),
        new Date(),
        new Date(),
      );
      const stock = new ProductStockDomain(
        productId,
        1_000,
        new Date(),
        new Date(),
      );

      productRepository.getById.mockResolvedValue(product);
      productStockRepository.getById.mockResolvedValue(stock);

      // when
      const result = await productService.getBy(productId);

      // then
      expect(result).toEqual(
        new SearchedProductDomain(
          product.id,
          product.name,
          product.price,
          stock.stock,
        ),
      );
    });

    it('제품을 찾을 수 없을 때 ProductNotFoundException을 던져야 합니다', async () => {
      // given
      const productId = BigInt(1);

      productRepository.getById.mockRejectedValue(
        new Error('Product not found'),
      );
      // Product가 존재하지 않으므로 관계 테이블인 ProductStock 조회 역시 실패함
      productStockRepository.getById.mockRejectedValue(
        new Error('Stock not found'),
      );

      // when & then
      await expect(productService.getBy(productId)).rejects.toThrow(
        ProductNotFoundException,
      );
    });

    it('재고를 찾을 수 없을 때 ProductNotFoundException을 던져야 합니다', async () => {
      // given
      const productId = BigInt(1);
      const product = new ProductDomain(
        productId,
        'Product 1',
        new Decimal(100),
        new Date(),
        new Date(),
      );

      productRepository.getById.mockResolvedValue(product);
      productStockRepository.getById.mockRejectedValue(
        new Error('Stock not found'),
      );

      // when & then
      await expect(productService.getBy(productId)).rejects.toThrow(
        ProductNotFoundException,
      );
    });
  });
});
