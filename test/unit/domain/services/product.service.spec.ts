import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { Effect } from 'effect';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ErrorCodes } from 'src/common/errors';
import {
  DeductStockCommand,
  ProductInfo,
  ProductStockInfo,
} from 'src/domain/dtos';
import {
  AppConflictException,
  AppNotFoundException,
} from 'src/domain/exceptions';
import { ProductStockModel } from 'src/domain/models';
import { ProductService } from 'src/domain/services';
import {
  PopularProductRepository,
  ProductRepository,
  ProductStockRepository,
} from 'src/infrastructure/database/repositories';
import { productServiceFixture } from './helpers/product.service.fixture';

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
          provide: PopularProductRepository,
          useFactory: () => mockDeep<PopularProductRepository>(),
        },
        {
          provide: ProductStockRepository,
          useFactory: () => mockDeep<ProductStockRepository>(),
        },
      ],
    }).compile();

    productStockRepository = module.get(ProductStockRepository);
    productService = module.get(ProductService);
    productRepository = module.get(ProductRepository);
  });

  describe('getById', () => {
    it('제품이 발견되면 제품을 반환해야 합니다', async () => {
      // given
      const { productId, product } = productServiceFixture();

      productRepository.getById.mockImplementation(() =>
        Effect.succeed(product),
      );

      // when
      const result = await Effect.runPromise(productService.getBy(productId));
      const expected = ProductInfo.from(product);
      // then
      expect(result).toEqual(expected);
    });

    it('제품을 찾을 수 없을 때 ProductNotFoundException을 던져야 합니다', async () => {
      // given
      const { productId } = productServiceFixture();
      productRepository.getById.mockImplementation(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND)),
      );

      // when & then
      await expect(
        Effect.runPromise(productService.getBy(productId)),
      ).rejects.toThrow(new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND));
    });
  });

  describe('getStockBy', () => {
    it('재고가 발견되면 재고를 반환해야 합니다', async () => {
      // given
      const productId = 1;
      const stock = new ProductStockModel({
        productId,
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      productStockRepository.getById.mockImplementation(() =>
        Effect.succeed(stock),
      );

      // when
      const result = await Effect.runPromise(
        productService.getStockBy(productId),
      );
      const expected = ProductStockInfo.from(stock);
      // then
      expect(result).toEqual(expected);
    });

    it('재고를 찾을 수 없을 때 ProductNotFoundException을 던져야 합니다', async () => {
      // given
      const productId = 999;
      productStockRepository.getById.mockImplementation(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND)),
      );

      // when & then
      await expect(
        Effect.runPromise(productService.getStockBy(productId)),
      ).rejects.toThrow(new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND));
    });
  });
  describe('deductStock', () => {
    it('재고보다 주문 수량이 많으면 AppConflictException을 던져야 합니다', async () => {
      // given
      const productId = 1;
      const command = new DeductStockCommand({
        orderItems: {
          [productId]: 11,
        },
      });
      const productStock = new ProductStockModel({
        productId,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const transaction = mockDeep<Prisma.TransactionClient>();

      productStockRepository.findByIdsWithXLock.mockImplementation(() =>
        Effect.succeed([productStock]),
      );

      // when & then
      await expect(
        Effect.runPromise(productService.deductStock(command, transaction)),
      ).rejects.toThrow(
        new AppConflictException(ErrorCodes.PRODUCT_OUT_OF_STOCK),
      );
    });

    it('재고가 있을 때 재고를 차감해야 합니다', async () => {
      // given
      const productId = 1;
      const deductAmount = 3;
      const initialStock = 10;

      const stock = new ProductStockModel({
        productId,
        stock: initialStock,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new DeductStockCommand({
        orderItems: {
          [productId]: deductAmount,
        },
      });
      const transaction = mockDeep<Prisma.TransactionClient>();

      productStockRepository.findByIdsWithXLock.mockImplementation(() =>
        Effect.succeed([stock]),
      );
      productStockRepository.updateBulk.mockImplementation(() =>
        Effect.succeed(void undefined),
      );

      // when
      await Effect.runPromise(productService.deductStock(command, transaction));

      // then
      expect(productStockRepository.updateBulk).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            productId,
            stock: initialStock - deductAmount,
          }),
        ],
        transaction,
      );
    });
  });
});
