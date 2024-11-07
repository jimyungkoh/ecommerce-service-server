import { Injectable } from '@nestjs/common';
import { Effect, pipe } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import { AddCartItemCommand } from 'src/domain/dtos/commands/cart/add-cart-item.command';
import { RemoveCartItemCommand } from 'src/domain/dtos/commands/cart/remove-cart-item.command';
import {
  ProductRepository,
  ProductStockRepository,
  UserRepository,
} from 'src/infrastructure/database/repositories';
import { CartItemRepository } from 'src/infrastructure/database/repositories/cart-item.repository';
import { CartRepository } from 'src/infrastructure/database/repositories/cart.repository';
import { CartInfo, CartItemInfo } from '../dtos/info';
import { GetCartByInfo } from '../dtos/info/cart/get-cart-by-info';
import { AppConflictException } from '../exceptions';
import { CartModel, UserModel } from '../models';

@Injectable()
export class CartService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cartRepository: CartRepository,
    private readonly cartItemRepository: CartItemRepository,
    private readonly productRepository: ProductRepository,
    private readonly productStockRepository: ProductStockRepository,
  ) {}

  create(userId: number) {
    return pipe(
      this.userRepository.getById(userId),
      Effect.flatMap((user) => this.cartRepository.create({ userId: user.id })),
      Effect.map(CartInfo.from),
    );
  }

  getCartBy(userId: number) {
    const getUserEffect = (userId: number) =>
      this.userRepository.getById(userId);
    const getCartEffect = (user: UserModel) =>
      this.cartRepository.getByUserId(user.id);

    const getCartItemsEffect = (cart: CartModel) => {
      return this.cartItemRepository.findByCartId(cart.id);
    };

    return pipe(
      getUserEffect(userId),
      Effect.flatMap((user) => getCartEffect(user)),
      Effect.flatMap((cart) =>
        Effect.map(getCartItemsEffect(cart), (cartItems) => ({
          cart,
          cartItems,
        })),
      ),
      Effect.map(({ cart, cartItems }) => GetCartByInfo.from(cart, cartItems)),
    );
  }

  addCartItem(command: AddCartItemCommand) {
    return pipe(
      this.productStockRepository.getById(command.productId),
      Effect.flatMap((productStock) => {
        if (!productStock.inStock(command.quantity)) {
          return Effect.fail(
            new AppConflictException(ErrorCodes.PRODUCT_OUT_OF_STOCK),
          );
        }
        return Effect.succeed(productStock);
      }),
      Effect.flatMap(() => this.cartRepository.getById(command.cartId)),
      Effect.flatMap((cart) =>
        pipe(
          this.cartItemRepository.create({
            cartId: cart.id,
            productId: command.productId,
            quantity: command.quantity,
          }),
          Effect.flatMap((cartItem) =>
            pipe(
              this.cartRepository.update(cart.id, {}),
              Effect.map(() => cartItem),
            ),
          ),
        ),
      ),
      Effect.map(CartItemInfo.from),
    );
  }

  removeCartItem(command: RemoveCartItemCommand) {
    return pipe(
      Effect.all([
        this.cartRepository.getByUserId(command.userId),
        this.productRepository.getById(command.productId),
      ]),
      Effect.flatMap(([cart, product]) => {
        Effect.all([
          this.cartItemRepository.deleteByCartIdAndProductId(
            cart.id,
            product.id,
          ),
          this.cartRepository.update(cart.id, {}),
        ]);
        return Effect.succeed(void 0);
      }),
      Effect.catchAll(Effect.fail),
    );
  }
}
