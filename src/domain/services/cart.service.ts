import { Injectable } from '@nestjs/common';
import { ErrorCodes } from 'src/common/errors';
import { AddCartItemCommand } from 'src/domain/dtos/commands/cart/add-cart-item.command';
import { RemoveCartItemCommand } from 'src/domain/dtos/commands/cart/remove-cart-item.command';
import {
  ProductRepository,
  ProductStockRepository,
} from 'src/infrastructure/database/repositories';
import { CartItemRepository } from 'src/infrastructure/database/repositories/cart-item.repository';
import { CartRepository } from 'src/infrastructure/database/repositories/cart.repository';
import { CartInfo, CartItemInfo } from '../dtos/info';
import { GetCartByInfo } from '../dtos/info/cart/get-cart-by-info';
import { AppConflictException, AppNotFoundException } from '../exceptions';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartItemRepository: CartItemRepository,
    private readonly productRepository: ProductRepository,
    private readonly productStockRepository: ProductStockRepository,
  ) {}

  async create(userId: number): Promise<CartInfo> {
    const cart = await this.cartRepository.create({ userId });

    return CartInfo.from(cart);
  }

  async getCartBy(userId: number): Promise<GetCartByInfo> {
    const cart = await this.cartRepository.getByUserId(userId).catch(() => {
      throw new AppNotFoundException(ErrorCodes.CART_NOT_FOUND);
    });

    const cartItems = await this.cartItemRepository.findByCartId(cart.id);

    return GetCartByInfo.from(cart, cartItems);
  }

  async addCartItem(command: AddCartItemCommand): Promise<CartItemInfo> {
    let productStock;

    try {
      productStock = await this.productStockRepository.getById(
        command.productId,
      );
    } catch {
      throw new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND);
    }

    if (!productStock.inStock(command.quantity))
      throw new AppConflictException(ErrorCodes.PRODUCT_OUT_OF_STOCK);

    try {
      await this.cartRepository.getById(command.cartId);
    } catch {
      throw new AppNotFoundException(ErrorCodes.CART_NOT_FOUND);
    }

    const cartItem = await this.cartItemRepository.create({
      cartId: command.cartId,
      productId: command.productId,
      quantity: command.quantity,
    });

    await this.cartRepository.update(command.cartId, {});

    return CartItemInfo.from(cartItem);
  }

  async removeCartItem(command: RemoveCartItemCommand): Promise<void> {
    let cart, product;

    try {
      cart = await this.cartRepository.getByUserId(command.userId);
    } catch {
      throw new AppNotFoundException(ErrorCodes.CART_NOT_FOUND);
    }

    try {
      product = await this.productRepository.getById(command.productId);
    } catch {
      throw new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND);
    }

    await this.cartItemRepository.deleteByCartIdAndProductId(
      cart.id,
      product.id,
    );

    await this.cartRepository.update(cart.id, {});
  }
}
