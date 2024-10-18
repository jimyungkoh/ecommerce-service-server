import { Injectable } from '@nestjs/common';
import { CartDomain, CartItemDomain } from 'src/domain';
import {
  ProductStockRepository,
  UserRepository,
} from 'src/infrastructure/database/repositories';
import { CartItemRepository } from 'src/infrastructure/database/repositories/cart-item.repository';
import { CartRepository } from 'src/infrastructure/database/repositories/cart.repository';
import { UserNotFoundException } from '../exceptions';
import { ProductOutOfStockException } from '../exceptions/product-out-of-stock.exception';

/**
 * 장바구니 서비스 클래스
 * @class
 */
@Injectable()
export class CartService {
  /**
   * CartService 생성자
   * @constructor
   * @param {CartRepository} cartRepository - 장바구니 저장소
   * @param {CartItemRepository} cartItemRepository - 장바구니 아이템 저장소
   * @param {ProductStockRepository} productStockRepository - 제품 재고 저장소
   * @param {UserRepository} userRepository - 사용자 저장소
   */
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartItemRepository: CartItemRepository,
    private readonly productStockRepository: ProductStockRepository,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * 사용자 ID로 장바구니를 가져옵니다.
   * @async
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Object>} 장바구니와 장바구니 아이템을 포함한 객체
   */
  async getCartBy(userId: number) {
    const user = await this.userRepository.getById(userId).catch(() => {
      throw new UserNotFoundException();
    });

    const cart = await this.cartRepository.getByUserId(user.id);
    const cartItems = await this.cartItemRepository.findByCartId(cart.id);

    return { ...cart, cartItems };
  }

  /**
   * 장바구니에 아이템을 추가합니다.
   * @async
   * @param {CartDomain} cart - 장바구니 도메인 객체
   * @param {bigint} productId - 제품 ID
   * @param {number} quantity - 수량
   * @returns {Promise<CartItemDomain>} 생성된 장바구니 아이템 객체
   * @throws {ProductOutOfStockException} 제품 재고가 부족할 경우 예외 발생
   */
  async addCartItem(
    cart: CartDomain,
    productId: bigint,
    quantity: number,
  ): Promise<CartItemDomain> {
    const productStock = await this.productStockRepository.getById(productId);

    if (!productStock.inStock(quantity)) throw new ProductOutOfStockException();

    const cartItem = await this.cartItemRepository.create({
      cartId: cart.id,
      productId,
      quantity,
    });

    await this.cartRepository.update(cart.id, {});

    return cartItem;
  }

  /**
   * 장바구니에서 아이템을 제거합니다.
   * @async
   * @param {number} cartId - 장바구니 ID
   * @param {number} productId - 제품 ID
   * @returns {Promise<void>}
   */
  async removeCartItem(cartId: number, productId: number): Promise<void> {
    await this.cartItemRepository.deleteByCartIdAndProductId(cartId, productId);
    await this.cartRepository.update(cartId, {});
  }
}
