import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ErrorCodes } from 'src/common/errors';
import { AddCartItemCommand, RemoveCartItemCommand } from 'src/domain/dtos';
import { CartInfo, CartItemInfo } from 'src/domain/dtos/info';
import { GetCartByInfo } from 'src/domain/dtos/info/cart/get-cart-by-info';
import { AppConflictException } from 'src/domain/exceptions';
import { CartModel, ProductModel, ProductStockModel } from 'src/domain/models';
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

      userRepository.getById.mockResolvedValue(user);
      cartRepository.getByUserId.mockResolvedValue(cart);
      cartItemRepository.findByCartId.mockResolvedValue([cartItem]);

      const result = await cartService.getCartBy(userId);

      expect(result).toEqual(
        new GetCartByInfo({
          cart: CartInfo.from(cart),
          cartItems: [CartItemInfo.from(cartItem)],
        }),
      );
    });

    it('존재하지 않는 사용자에 대한 장바구니를 반환하려고 하면 오류를 발생시켜야 합니다', async () => {
      const userId = 999;
      userRepository.getById.mockRejectedValue(new Error());

      await expect(cartService.getCartBy(userId)).rejects.toThrow();
    });
  });

  describe('addCartItem', () => {
    it('장바구니 항목을 추가하고 장바구니를 업데이트해야 합니다', async () => {
      const { cart, cartItem, productStock } = cartServiceFixture();
      const productId = 1;
      const quantity = 2;

      productStockRepository.getById.mockResolvedValue(productStock);
      cartItemRepository.create.mockResolvedValue(cartItem);
      cartRepository.getById.mockResolvedValue(cart);

      const result = await cartService.addCartItem(
        new AddCartItemCommand({ cartId: cart.id, productId, quantity }),
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

      productStockRepository.getById.mockResolvedValue(outOfStockProduct);

      await expect(
        cartService.addCartItem(
          new AddCartItemCommand({ cartId: cart.id, productId, quantity }),
        ),
      ).rejects.toThrow(
        new AppConflictException(ErrorCodes.PRODUCT_OUT_OF_STOCK),
      );
    });

    it('존재하지 않는 제품을 추가하려고 하면 오류를 발생시켜야 합니다', async () => {
      const { cart } = cartServiceFixture();
      const productId = 999;
      const quantity = 2;

      productStockRepository.getById.mockRejectedValue(new Error());

      await expect(
        cartService.addCartItem(
          new AddCartItemCommand({ cartId: cart.id, productId, quantity }),
        ),
      ).rejects.toThrow();
    });
  });

  describe('removeCartItem', () => {
    it('장바구니 항목을 제거하고 장바구니를 업데이트해야 합니다', async () => {
      const { userId, cart } = cartServiceFixture();
      const productId = 1;

      cartRepository.getByUserId.mockResolvedValue(
        new CartModel({
          id: cart.id,
          userId: cart.userId,
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt,
        }),
      );

      productRepository.getById.mockResolvedValue(
        new ProductModel({
          id: productId,
          name: 'testProduct',
          price: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      await cartService.removeCartItem(
        new RemoveCartItemCommand({ userId, productId }),
      );

      expect(
        cartItemRepository.deleteByCartIdAndProductId,
      ).toHaveBeenCalledWith(cart.id, productId);
      expect(cartRepository.update).toHaveBeenCalledWith(cart.id, {});
    });

    it('존재하지 않는 장바구니 항목을 제거하려고 하면 오류를 발생시켜야 합니다', async () => {
      const { userId } = cartServiceFixture();
      const productId = 999;

      cartItemRepository.deleteByCartIdAndProductId.mockRejectedValue(
        new Error(),
      );

      await expect(
        cartService.removeCartItem(
          new RemoveCartItemCommand({
            userId,
            productId,
          }),
        ),
      ).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('사용자의 장바구니를 생성하고 CartInfo를 반환해야 합니다', async () => {
      // given
      const { cart } = cartServiceFixture();
      cartRepository.create.mockResolvedValue(cart);

      // when
      const result = await cartService.create(cart.userId);

      // then
      expect(result).toEqual(CartInfo.from(cart));
    });
  });
});
