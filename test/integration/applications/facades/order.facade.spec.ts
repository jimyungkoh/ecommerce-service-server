import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import { ErrorCodes } from 'src/common/errors';
import { LoggerModule } from 'src/common/logger';
import { CartInfo, CartItemInfo, OrderInfo } from 'src/domain/dtos/info';
import { AppConflictException } from 'src/domain/exceptions/app-conflict.exception';
import { AppNotFoundException } from 'src/domain/exceptions/app-not-found.exception';
import {
  CartService,
  OrderService,
  ProductService,
  WalletService,
} from 'src/domain/services';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import {
  prismaService,
  testDataFactory,
} from 'test/integration/test-containers/setup-tests';
import { OrderFacade } from '../../../../src/application/facades';
import { PrismaService } from '../../../../src/infrastructure/database/prisma.service';
import { OrderItemCreateDto } from '../../../../src/presentation/dtos/order-create.dto';

describe('OrderFacade (integration)', () => {
  let orderFacade: OrderFacade;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [InfrastructureModule, LoggerModule],
      providers: [
        OrderFacade,
        { provide: PrismaService, useValue: prismaService },
        CartService,
        OrderService,
        ProductService,
        WalletService,
      ],
    }).compile();

    orderFacade = moduleFixture.get(OrderFacade);
  });

  beforeEach(async () => {
    await testDataFactory.cleanupDatabase();
  });

  describe('order', () => {
    describe('성공 케이스', () => {
      it('주문을 성공적으로 생성해야 합니다', async () => {
        // given
        const products = await Promise.all([
          testDataFactory.createProduct({ price: new Decimal(100) }),
          testDataFactory.createProduct({ price: new Decimal(200) }),
        ]);
        const productStocks = await Promise.all(
          products.map((product) =>
            testDataFactory.createProductStock(product.id, { stock: 100 }),
          ),
        );
        const user = await testDataFactory.createUser();

        const wallet = await testDataFactory.createWallet(user.id, {
          totalPoint: 1_000,
        });
        const orderItemDtos: OrderItemCreateDto[] = [
          { productId: products[0].id, quantity: 2 }, // 100 * 2 = 200
          { productId: products[1].id, quantity: 3 }, // 200 * 3 = 600
        ];

        // when
        const orderResult = await orderFacade.order(user.id, orderItemDtos);

        // then
        // 1. OrderInfo 검증
        expect(orderResult).toMatchObject(
          new OrderInfo({
            id: expect.any(BigInt),
            userId: user.id,
            status: OrderStatus.PAID,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }),
        );

        // 2. 지갑 포인트 검증
        const resultWalletPoint = (
          await testDataFactory.getWallet(user.id)
        ).totalPoint.toString();
        const orderItems = await testDataFactory.getOrderItems(
          BigInt(orderResult.id),
        );
        const totalOrderAmount = orderItems.reduce(
          (acc, cur) => acc.plus(cur.price.times(cur.quantity)),
          new Decimal(0),
        );

        const expectedWalletPoint = new Decimal(wallet.totalPoint)
          .minus(totalOrderAmount)
          .toString();
        expect(resultWalletPoint).toBe(expectedWalletPoint);

        // 3. 재고 검증
        const resultStocks = await Promise.all(
          orderItemDtos.map(async (orderItemDto) => {
            const stock = await testDataFactory.getProductStock(
              orderItemDto.productId,
            );
            return {
              productId: stock.productId,
              stock: stock.stock,
            };
          }),
        );

        const expectedStocks = productStocks.map((productStock) => ({
          productId: productStock.productId,
          stock:
            productStock.stock -
            orderItemDtos.find(
              (item) => item.productId === productStock.productId,
            )!.quantity,
        }));

        expect(resultStocks).toEqual(expectedStocks);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 제품으로 주문을 시도하면 실패해야 합니다', async () => {
        // given
        const user = await testDataFactory.createUser();
        const orderItemDtos: OrderItemCreateDto[] = [
          { productId: BigInt(999), quantity: 2 },
        ];

        // when & then
        await expect(orderFacade.order(user.id, orderItemDtos)).rejects.toThrow(
          new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND),
        );
      });

      it('주문 금액이 지갑 포인트보다 많으면 주문을 실패해야 합니다', async () => {
        const products = await Promise.all([
          testDataFactory.createProduct({ price: new Decimal(100) }),
          testDataFactory.createProduct({ price: new Decimal(200) }),
        ]);

        //'표준'이 아니잖아 그리고 BigInt도 es 2015인가? 도입된 개념으로 알고 있는데,
        // 직렬화 지원 안되는 게 진짜 개웃김 ㅋㅋㅋㅋㅋ
        await Promise.all(
          products.map((product) =>
            testDataFactory.createProductStock(product.id, { stock: 100 }),
          ),
        );

        const user = await testDataFactory.createUser();
        await testDataFactory.createWallet(user.id, {
          totalPoint: 1_000,
        });

        // given
        const orderItemDtos = [
          { productId: products[0].id, quantity: 2 },
          { productId: products[1].id, quantity: 6 },
        ];

        // when & then
        await expect(orderFacade.order(user.id, orderItemDtos)).rejects.toThrow(
          new AppConflictException(ErrorCodes.WALLET_INSUFFICIENT_POINT),
        );
      });

      it('주문 수량이 재고보다 많으면 주문을 실패해야 합니다', async () => {
        // given
        const product = await testDataFactory.createProduct({
          price: new Decimal(100),
        });
        await testDataFactory.createProductStock(product.id, { stock: 100 });

        const user = await testDataFactory.createUser();
        await testDataFactory.createWallet(user.id, {
          totalPoint: 30_000,
        });

        const orderItemDtos = [{ productId: product.id, quantity: 101 }];

        // when
        const resultPromise = orderFacade.order(user.id, orderItemDtos);
        const expectedException = new AppConflictException(
          ErrorCodes.PRODUCT_OUT_OF_STOCK,
        );

        // then
        await expect(resultPromise).rejects.toThrow(expectedException);
      });
    });

    describe('동시성 테스트', () => {
      it(`4명의 사용자가 동시에 3개씩 주문할 경우
          - 3명의 사용자는 주문에 성공해야 하며
          - 1명의 사용자는 주문에 실패해야 하고
          - 재고는 1개 남아 있어야 합니다`, async () => {
        // given
        const initialStock = 10;
        const orderQuantity = 3;
        const concurrentOrders = 4; // 총 주문량 12개 (3개 * 4명)

        // 상품 생성
        const product = await testDataFactory.createProduct({
          price: new Decimal(100),
        });
        await testDataFactory.createProductStock(product.id, {
          stock: initialStock,
        });

        // 여러 사용자 생성
        const users = await Promise.all(
          Array(concurrentOrders)
            .fill(null)
            .map(async () => {
              const user = await testDataFactory.createUser();
              await testDataFactory.createWallet(user.id, {
                totalPoint: 1000,
              });
              return user;
            }),
        );

        // when
        const orderPromises = users.map((user) =>
          orderFacade.order(user.id, [
            {
              productId: product.id,
              quantity: orderQuantity,
            },
          ]),
        );

        // then
        const results = await Promise.allSettled(orderPromises);

        // 성공한 주문 수 확인
        const successfulOrders = results.filter(
          (result) => result.status === 'fulfilled',
        ).length;

        // 실패한 주문 수 확인
        const failedOrders = results.filter(
          (result) => result.status === 'rejected',
        ).length;

        // 재고 확인
        const finalStock = (await testDataFactory.getProductStock(product.id))
          .stock;

        // 검증
        expect(successfulOrders).toBe(3);
        expect(finalStock).toBe(1);
        expect(failedOrders).toBe(1);
      });

      it('100명의 사용자가 동시에 1개씩 주문할 경우, 정확히 50개만 주문되어야 합니다', async () => {
        // given
        const initialStock = 50;
        const orderQuantity = 1;
        const concurrentUsers = 100;

        const product = await testDataFactory.createProduct({
          price: new Decimal(100),
        });
        await testDataFactory.createProductStock(product.id, {
          stock: initialStock,
        });

        const users = await Promise.all(
          Array(concurrentUsers)
            .fill(null)
            .map(async () => {
              const user = await testDataFactory.createUser();
              await testDataFactory.createWallet(user.id, {
                totalPoint: 1_000,
              });
              return user;
            }),
        );

        // when
        const orderPromises = users.map((user) =>
          orderFacade.order(user.id, [
            {
              productId: product.id,
              quantity: orderQuantity,
            },
          ]),
        );

        // then
        const results = await Promise.allSettled(orderPromises);
        const successfulOrders = results.filter(
          (result) => result.status === 'fulfilled',
        ).length;
        const failedOrders = results.filter(
          (result) => result.status === 'rejected',
        ).length;

        const finalStock = (await testDataFactory.getProductStock(product.id))
          .stock;

        expect(successfulOrders).toBe(50);
        expect(failedOrders).toBe(50);
        expect(finalStock).toBe(0);
      });
    });
  });

  describe('getCartBy', () => {
    describe('성공 케이스', () => {
      it('유효한 사용자에 대해 장바구니와 장바구니 항목을 반환해야 합니다', async () => {
        // given
        const user = await testDataFactory.createUser();
        const products = await Promise.all([
          testDataFactory.createProduct({ price: new Decimal(100) }),
          testDataFactory.createProduct({ price: new Decimal(200) }),
        ]);
        const cart = await testDataFactory.createCart(user.id);
        const cartItems = await Promise.all([
          testDataFactory.createCartItem(cart.id, products[0].id, {
            quantity: 2,
          }),
          testDataFactory.createCartItem(cart.id, products[1].id, {
            quantity: 3,
          }),
        ]);

        // when
        const result = await orderFacade.getCartBy(user.id);

        // then
        expect(result.cart).toMatchObject(CartInfo.from(cart));

        const sortCartItems = (items: CartItemInfo[]) =>
          [...items].sort((a, b) => Number(a.productId) - Number(b.productId));

        const resultItems = sortCartItems(result.cartItems);
        const expectedItems = sortCartItems([
          CartItemInfo.from(cartItems[0]),
          CartItemInfo.from(cartItems[1]),
        ]);

        expect(
          resultItems.map((item) => ({
            ...item,
            id: expect.any(String),
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          })),
        ).toEqual(
          expectedItems.map((item) => ({
            ...item,
            id: expect.any(String),
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          })),
        );
      });
    });

    describe('실패 케이스', () => {
      it('유효하지 않은 사용자의 장바구니 가져오기는 실패해야 합니다', async () => {
        const resultPromise = orderFacade.getCartBy(999);
        const expectedException = new AppNotFoundException(
          ErrorCodes.CART_NOT_FOUND,
        );

        await expect(resultPromise).rejects.toThrow(expectedException);
      });
    });
  });

  describe('addCartItem', () => {
    describe('성공 케이스', () => {
      it('장바구니에 아이템을 추가해야 합니다', async () => {
        // given
        const user = await testDataFactory.createUser();
        const cart = await testDataFactory.createCart(user.id);
        const newProduct = await testDataFactory.createProduct({
          price: new Decimal(1000),
        });
        await testDataFactory.createProductStock(newProduct.id, { stock: 100 });

        // when
        const resultCartItem = await orderFacade.addCartItem(
          user.id,
          newProduct.id,
          2,
        );

        const expectedCartItem = new CartItemInfo({
          id: expect.any(BigInt),
          cartId: cart.id,
          productId: newProduct.id,
          quantity: 2,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });

        // then
        expect(resultCartItem).toMatchObject(expectedCartItem);
      });
    });

    describe('실패 케이스', () => {
      it('유효하지 않은 사용자에 대해 장바구니에 아이템을 추가하면 실패해야 합니다', async () => {
        const products = await Promise.all([
          testDataFactory.createProduct({ price: new Decimal(100) }),
        ]);
        const resultPromise = orderFacade.addCartItem(999, products[0].id, 2);
        const expectedException = new AppNotFoundException(
          ErrorCodes.CART_NOT_FOUND,
        );

        await expect(resultPromise).rejects.toThrow(expectedException);
      });

      it('존재하지 않는 제품을 장바구니에 추가하면 실패해야 합니다', async () => {
        const user = await testDataFactory.createUser();
        await testDataFactory.createCart(user.id);
        const resultPromise = orderFacade.addCartItem(user.id, BigInt(999), 2);
        const expectedException = new AppNotFoundException(
          ErrorCodes.PRODUCT_NOT_FOUND,
        );

        await expect(resultPromise).rejects.toThrow(expectedException);
      });

      it('재고가 부족한 제품을 장바구니에 추가하면 실패해야 합니다', async () => {
        const product = await testDataFactory.createProduct({
          price: new Decimal(100),
        });
        await testDataFactory.createProductStock(product.id, {
          stock: 100,
        });

        const user = await testDataFactory.createUser();
        await testDataFactory.createCart(user.id);
        const resultPromise = orderFacade.addCartItem(user.id, product.id, 200);
        const expectedException = new AppConflictException(
          ErrorCodes.PRODUCT_OUT_OF_STOCK,
        );

        await expect(resultPromise).rejects.toThrow(expectedException);
      });
    });
  });

  describe('removeCartItem', () => {
    describe('성공 케이스', () => {
      it('장바구니에서 아이템을 제거해야 합니다', async () => {
        // given
        const user = await testDataFactory.createUser();
        const cart = await testDataFactory.createCart(user.id);
        const products = await Promise.all([
          testDataFactory.createProduct({ price: new Decimal(100) }),
        ]);

        await testDataFactory.createCartItem(cart.id, products[0].id, {
          quantity: 2,
        });

        // when
        await orderFacade.removeCartItem(user.id, products[0].id);

        // then
        const cartItems = await prismaService.cartItem.findMany({
          where: { cartId: cart.id },
        });

        expect(cartItems).toHaveLength(0);
      });
    });

    describe('실패 케이스', () => {
      it('유효하지 않은 사용자에 대해 장바구니에서 아이템을 제거하면 실패해야 합니다', async () => {
        const products = await Promise.all([
          testDataFactory.createProduct({ price: new Decimal(100) }),
        ]);
        const resultPromise = orderFacade.removeCartItem(999, products[0].id);
        const expectedException = new AppNotFoundException(
          ErrorCodes.CART_NOT_FOUND,
        );

        await expect(resultPromise).rejects.toThrow(expectedException);
      });

      it('존재하지 않는 제품을 장바구니에서 제거하면 실패해야 합니다', async () => {
        const user = await testDataFactory.createUser();
        await testDataFactory.createCart(user.id);
        const resultPromise = orderFacade.removeCartItem(user.id, BigInt(999));
        const expectedException = new AppNotFoundException(
          ErrorCodes.PRODUCT_NOT_FOUND,
        );

        await expect(resultPromise).rejects.toThrow(expectedException);
      });
    });
  });
});
