import { faker } from '@faker-js/faker/.';
import { Test, TestingModule } from '@nestjs/testing';
import { Effect } from 'effect';
import { AppModule } from 'src/app.module';
import { ProductFacade } from 'src/application/facades';
import { ErrorCodes } from 'src/common/errors';
import { PopularProductInfo, ProductInfo } from 'src/domain/dtos/info';
import { AppNotFoundException } from 'src/domain/exceptions';
import { testDataFactory } from 'test/integration/test-containers/setup-tests';

describe('ProductFacade (integration)', () => {
  let productFacade: ProductFacade;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    productFacade = moduleFixture.get(ProductFacade);
  });

  beforeEach(async () => {
    await testDataFactory.cleanupDatabase();
  });

  describe('getProductById', () => {
    it('성공 케이스', async () => {
      // given
      const product = await testDataFactory.createProduct();

      // when
      const result = await Effect.runPromise(
        productFacade.getProductById(product.id),
      );
      const expectedProduct = ProductInfo.from(product);

      // then
      expect(result).toEqual(expectedProduct);
    });

    it('상품이 존재하지 않는 경우', async () => {
      // given
      const productId = faker.number.int();

      // when
      const resultPromise = Effect.runPromise(
        productFacade.getProductById(productId),
      );

      // then
      await expect(resultPromise).rejects.toThrow(
        new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND),
      );
    });
  });

  describe('getPopularProducts', () => {
    it('성공 케이스', async () => {
      // given
      // 여러 개 날짜 존재
      const aggregationDate1 = faker.date.recent();
      const aggregationDate2 = new Date(
        aggregationDate1.getTime() + 1000 * 60 * 60 * 24,
      );

      const popularProducts = await Promise.all(
        Array.from({ length: 3 }).map(async () => {
          return await testDataFactory.createPopularProduct({
            productId: faker.number.int(),
            salesCount: faker.number.int({ min: 1, max: 100 }),
            aggregationDate: aggregationDate1,
          });
        }),
      );

      await Promise.all(
        Array.from({ length: 3 }).map(async () => {
          return await testDataFactory.createPopularProduct({
            productId: faker.number.int(),
            salesCount: faker.number.int({ min: 1, max: 100 }),
            aggregationDate: aggregationDate2,
          });
        }),
      );

      // when
      const products = await Effect.runPromise(
        productFacade.getPopularProducts(aggregationDate1),
      );

      const expectedProducts = PopularProductInfo.fromList(
        popularProducts.sort((a, b) => (a.salesCount > b.salesCount ? 1 : -1)),
      );

      // then
      expect(products).toHaveLength(expectedProducts.length);
      products.forEach((product, index) => {
        expect(product).toMatchObject({
          productId: expectedProducts[index].productId,
          salesCount: expectedProducts[index].salesCount,
          aggregationDate: expectedProducts[index].aggregationDate,
        });
      });
    });
  });
});
