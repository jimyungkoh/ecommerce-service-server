import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ProductOutOfStockException } from 'src/application/exceptions/product-out-of-stock.exception';
import { CartService } from 'src/application/services/cart.service';
import {
  CartDomain,
  CartItemDomain,
  ProductStockDomain,
  UserDomain,
} from 'src/domain';
import { CartItemRepository } from 'src/infrastructure/database/repositories/cart-item.repository';
import { CartRepository } from 'src/infrastructure/database/repositories/cart.repository';
import { ProductStockRepository } from 'src/infrastructure/database/repositories/product-stock.repository';
import { UserRepository } from 'src/infrastructure/database/repositories/user.repository';

describe('CartService', () => {
  let cartService: CartService;
  let cartRepository: DeepMockProxy<CartRepository>;
  let cartItemRepository: DeepMockProxy<CartItemRepository>;
  let productStockRepository: DeepMockProxy<ProductStockRepository>;
  let userRepository: DeepMockProxy<UserRepository>;

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
          provide: ProductStockRepository,
          useValue: mockDeep<ProductStockRepository>(),
        },
        { provide: UserRepository, useValue: mockDeep<UserRepository>() },
      ],
    }).compile();

    cartService = module.get<CartService>(CartService);
    cartRepository = module.get(CartRepository);
    cartItemRepository = module.get(CartItemRepository);
    productStockRepository = module.get(ProductStockRepository);
    userRepository = module.get(UserRepository);
  });

  describe('getCartBy', () => {
    it('사용자에 대한 장바구니와 항목을 반환해야 합니다', async () => {
      const userId = 1;
      const user = new UserDomain(
        userId,
        'test@email.com',
        new Date(),
        new Date(),
      );
      const cart = new CartDomain(1, userId, new Date(), new Date());
      const cartItems = [
        new CartItemDomain(
          BigInt(1),
          cart.id,
          BigInt(1),
          2,
          new Date(),
          new Date(),
        ),
      ];

      userRepository.getById.mockResolvedValue(user);
      cartRepository.getByUserId.mockResolvedValue(cart);
      cartItemRepository.findByCartId.mockResolvedValue(cartItems);

      const result = await cartService.getCartBy(userId);

      expect(result).toEqual({ ...cart, cartItems });
    });

    it('존재하지 않는 사용자에 대한 장바구니를 반환하려고 하면 오류를 발생시켜야 합니다', async () => {
      const userId = 999;

      userRepository.getById.mockRejectedValue(new Error());

      await expect(cartService.getCartBy(userId)).rejects.toThrow();
    });
  });

  describe('addCartItem', () => {
    it('장바구니 항목을 추가하고 장바구니를 업데이트해야 합니다', async () => {
      const cart: CartDomain = new CartDomain(1, 1, new Date(), new Date());
      const productId = BigInt(1);
      const quantity = 2;
      const productStock = new ProductStockDomain(
        productId,
        10,
        new Date(),
        new Date(),
      );
      const cartItem = new CartItemDomain(
        BigInt(1),
        cart.id,
        productId,
        quantity,
        new Date(),
        new Date(),
      );

      productStockRepository.getById.mockResolvedValue(productStock);
      cartItemRepository.create.mockResolvedValue(cartItem);

      const result = await cartService.addCartItem(cart, productId, quantity);

      expect(result).toEqual(cartItem);
      expect(cartRepository.update).toHaveBeenCalledWith(cart.id, {});
    });

    it('제품이 재고가 없으면 ProductOutOfStockException을 발생시켜야 합니다', async () => {
      const cart: CartDomain = new CartDomain(1, 1, new Date(), new Date());
      const productId = BigInt(1);
      const quantity = 2;
      const productStock = new ProductStockDomain(
        productId,
        0,
        new Date(),
        new Date(),
      );

      productStockRepository.getById.mockResolvedValue(productStock);

      await expect(
        cartService.addCartItem(cart, productId, quantity),
      ).rejects.toThrow(ProductOutOfStockException);
    });

    it('존재하지 않는 제품을 추가하려고 하면 오류를 발생시켜야 합니다', async () => {
      const cart: CartDomain = new CartDomain(1, 1, new Date(), new Date());
      const productId = BigInt(999);
      const quantity = 2;

      productStockRepository.getById.mockRejectedValue(new Error());

      await expect(
        cartService.addCartItem(cart, productId, quantity),
      ).rejects.toThrow();
    });
  });

  describe('removeCartItem', () => {
    it('장바구니 항목을 제거하고 장바구니를 업데이트해야 합니다', async () => {
      const cartId = 1;
      const productId = 1;

      await cartService.removeCartItem(cartId, productId);

      expect(
        cartItemRepository.deleteByCartIdAndProductId,
      ).toHaveBeenCalledWith(cartId, productId);
      expect(cartRepository.update).toHaveBeenCalledWith(cartId, {});
    });

    it('존재하지 않는 장바구니 항목을 제거하려고 하면 오류를 발생시켜야 합니다', async () => {
      const cartId = 1;
      const productId = 999;

      cartItemRepository.deleteByCartIdAndProductId.mockRejectedValue(
        new Error(),
      );

      await expect(
        cartService.removeCartItem(cartId, productId),
      ).rejects.toThrow();
    });
  });
});
