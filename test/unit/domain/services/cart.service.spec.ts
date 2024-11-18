import { Test, TestingModule } from '@nestjs/testing';
import { Effect } from 'effect';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ErrorCodes } from 'src/common/errors';
import { AddCartItemCommand, RemoveCartItemCommand } from 'src/domain/dtos';
import { CartInfo, CartItemInfo } from 'src/domain/dtos/info';
import { GetCartByInfo } from 'src/domain/dtos/info/cart/get-cart-by-info';
import {
  AppConflictException,
  AppNotFoundException,
} from 'src/domain/exceptions';
import {
  CartModel,
  ProductModel,
  ProductStockModel,
  UserModel,
} from 'src/domain/models';
import { CartService } from 'src/domain/services';
import { CartItemRepository } from 'src/infrastructure/database/repositories/cart-item.repository';
import { CartRepository } from 'src/infrastructure/database/repositories/cart.repository';
import { ProductStockRepository } from 'src/infrastructure/database/repositories/product-stock.repository';
import { ProductRepository } from 'src/infrastructure/database/repositories/product.repository';
import { UserRepository } from 'src/infrastructure/database/repositories/user.repository';
import { cartServiceFixture } from './helpers/cart.service.fixture';

describe('CartService', () => {
  let cartService: CartService;
  let cartRepository: DeepMockProxy<CartRepository>;
  let cartItemRepository: DeepMockProxy<CartItemRepository>;
  let productStockRepository: DeepMockProxy<ProductStockRepository>;
  let userRepository: DeepMockProxy<UserRepository>;
  let productRepository: DeepMockProxy<ProductRepository>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: CartRepository, useValue: mockDeep<CartRepository>() },
        {
          provide: CartItemRepository,
          useValue: mockDeep<CartItemRepository>(),
        },
        {
          provide: ProductRepository,
          useValue: mockDeep<ProductRepository>(),
        },
        {
          provide: ProductStockRepository,
          useValue: mockDeep<ProductStockRepository>(),
        },
        { provide: UserRepository, useValue: mockDeep<UserRepository>() },
      ],
    }).compile();

    cartService = module.get(CartService);
    cartRepository = module.get(CartRepository);
    cartItemRepository = module.get(CartItemRepository);
    productStockRepository = module.get(ProductStockRepository);
    userRepository = module.get(UserRepository);
    productRepository = module.get(ProductRepository);
  });

  describe('getCartBy', () => {
    it('사용자에 대한 장바구니와 항목을 반환해야 합니다', async () => {
      const { userId, user, cart, cartItem } = cartServiceFixture();

      userRepository.getById.mockImplementation(() => Effect.succeed(user));
      cartRepository.getByUserId.mockImplementation(() => Effect.succeed(cart));
      cartItemRepository.findByCartId.mockImplementation(() =>
        Effect.succeed([cartItem]),
      );

      const result = await Effect.runPromise(cartService.getCartBy(userId));

      expect(result).toEqual(
        new GetCartByInfo({
          cart: CartInfo.from(cart),
          cartItems: [CartItemInfo.from(cartItem)],
        }),
      );
    });

    it('존재하지 않는 사용자에 대한 장바구니를 반환하려고 하면 오류를 발생시켜야 합니다', async () => {
      const userId = 999;
      userRepository.getById.mockImplementation(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.USER_NOT_FOUND)),
      );

      await expect(
        Effect.runPromise(cartService.getCartBy(userId)),
      ).rejects.toThrow(new AppNotFoundException(ErrorCodes.USER_NOT_FOUND));
    });
  });

  describe('addCartItem', () => {
    it('장바구니 항목을 추가하고 장바구니를 업데이트해야 합니다', async () => {
      const { cart, cartItem, productStock } = cartServiceFixture();
      const productId = 1;
      const quantity = 2;

      productStockRepository.getById.mockReturnValue(
        Effect.succeed(productStock),
      );
      cartRepository.getById.mockReturnValue(Effect.succeed(cart));
      cartItemRepository.create.mockReturnValue(Effect.succeed(cartItem));
      cartRepository.update.mockReturnValue(Effect.succeed(cart));
      const result = await Effect.runPromise(
        cartService.addCartItem(
          new AddCartItemCommand({ cartId: cart.id, productId, quantity }),
        ),
      );

      expect(result).toEqual(CartItemInfo.from(cartItem));
      expect(cartRepository.update).toHaveBeenCalledWith(cart.id, {});
    });

    it('제품이 재고가 없으면 ProductOutOfStockException을 발생시켜야 합니다', async () => {
      const { cart } = cartServiceFixture();
      const productId = 1;
      const quantity = 2;

      const outOfStockProduct = new ProductStockModel({
        productId,
        stock: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      productStockRepository.getById.mockImplementation(() =>
        Effect.succeed(outOfStockProduct),
      );

      await expect(
        Effect.runPromise(
          cartService.addCartItem(
            new AddCartItemCommand({ cartId: cart.id, productId, quantity }),
          ),
        ),
      ).rejects.toThrow(
        new AppConflictException(ErrorCodes.PRODUCT_OUT_OF_STOCK),
      );
    });

    it('존재하지 않는 제품을 추가하려고 하면 오류를 발생시켜야 합니다', async () => {
      const { cart } = cartServiceFixture();
      const productId = 999;
      const quantity = 2;

      productStockRepository.getById.mockImplementation(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND)),
      );

      await expect(
        Effect.runPromise(
          cartService.addCartItem(
            new AddCartItemCommand({ cartId: cart.id, productId, quantity }),
          ),
        ),
      ).rejects.toThrow(new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND));
    });
  });

  describe('removeCartItem', () => {
    it('장바구니 항목을 제거하고 장바구니를 업데이트해야 합니다', async () => {
      const { userId, cart } = cartServiceFixture();
      const productId = 1;
      const cartModel = new CartModel({
        id: cart.id,
        userId: cart.userId,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      });
      const productModel = new ProductModel({
        id: productId,
        name: 'testProduct',
        price: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      cartRepository.getByUserId.mockImplementation(() =>
        Effect.succeed(cartModel),
      );
      productRepository.getById.mockImplementation(() =>
        Effect.succeed(productModel),
      );
      cartItemRepository.deleteByCartIdAndProductId.mockImplementation(() =>
        Effect.succeed(void 0),
      );
      cartRepository.update.mockImplementation(() => Effect.succeed(cart));

      await Effect.runPromise(
        cartService.removeCartItem(
          new RemoveCartItemCommand({ userId, productId }),
        ),
      );

      expect(
        cartItemRepository.deleteByCartIdAndProductId,
      ).toHaveBeenCalledWith(cart.id, productId);
      expect(cartRepository.update).toHaveBeenCalledWith(cart.id, {});
    });

    it('존재하지 않는 장바구니 항목을 제거하려고 하면 오류를 발생시켜야 합니다', async () => {
      const { userId } = cartServiceFixture();
      const productId = 999;
      const productModel = new ProductModel({
        id: productId,
        name: 'testProduct',
        price: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      productRepository.getById.mockImplementation(() =>
        Effect.succeed(productModel),
      );
      cartRepository.getByUserId.mockImplementation(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.CART_NOT_FOUND)),
      );

      const removeCartItem = cartService.removeCartItem(
        new RemoveCartItemCommand({ userId, productId }),
      );

      await expect(Effect.runPromise(removeCartItem)).rejects.toThrow(
        new AppNotFoundException(ErrorCodes.CART_NOT_FOUND),
      );
    });
  });

  describe('create', () => {
    it('사용자의 장바구니를 생성하고 CartInfo를 반환해야 합니다', async () => {
      // given
      const { cart } = cartServiceFixture();

      const userModel = new UserModel({
        id: cart.userId,
        email: 'test@test.com',
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userRepository.getById.mockImplementation(() =>
        Effect.succeed(userModel),
      );
      cartRepository.create.mockImplementation(() => Effect.succeed(cart));

      // when
      const result = await Effect.runPromise(cartService.create(cart.userId));

      // then
      expect(result).toEqual(CartInfo.from(cart));
    });
  });
});
