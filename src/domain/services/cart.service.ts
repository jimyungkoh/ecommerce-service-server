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
import { CartInfo, CartItemInfo, GetCartByInfo } from '../dtos/info';
import { AppConflictException } from '../exceptions';
import {
  CartModel,
  ProductModel,
  ProductStockModel,
  UserModel,
} from '../models';

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
    const getUser = (userId: number) => this.userRepository.getById(userId);
    const getCart = (user: UserModel) =>
      this.cartRepository.getByUserId(user.id);

    const getCartItems = (cart: CartModel) =>
      this.cartItemRepository.findByCartId(cart.id);

    return pipe(
      getUser(userId),
      Effect.flatMap((user) => getCart(user)),
      Effect.flatMap((cart) =>
        Effect.map(getCartItems(cart), (cartItems) => ({
          cart,
          cartItems,
        })),
      ),
      Effect.map(({ cart, cartItems }) => GetCartByInfo.from(cart, cartItems)),
    );
  }

  addCartItem(command: AddCartItemCommand) {
    const checkStockAvailability = (productStock: ProductStockModel) =>
      Effect.if(productStock.inStock(command.quantity), {
        onTrue: () => Effect.succeed(productStock),
        onFalse: () =>
          Effect.fail(
            new AppConflictException(ErrorCodes.PRODUCT_OUT_OF_STOCK),
          ),
      });

    const createCartItem = (cart: CartModel) =>
      this.cartItemRepository.create({
        cartId: cart.id,
        productId: command.productId,
        quantity: command.quantity,
      });

    return pipe(
      this.productStockRepository.getById(command.productId),
      Effect.flatMap(checkStockAvailability),
      Effect.flatMap(() => this.cartRepository.getById(command.cartId)),
      Effect.tap((cart) => this.cartRepository.update(cart.id, {})),
      Effect.flatMap(createCartItem),
      Effect.map(CartItemInfo.from),
    );
  }

  removeCartItem(command: RemoveCartItemCommand) {
    const getCartAndProductEffect = (command: RemoveCartItemCommand) =>
      Effect.all([
        this.cartRepository.getByUserId(command.userId),
        this.productRepository.getById(command.productId),
      ]);

    const deleteCartItemEffect = ([cart, product]: [CartModel, ProductModel]) =>
      pipe(
        Effect.all([
          this.cartItemRepository.deleteByCartIdAndProductId(
            cart.id,
            product.id,
          ),
          this.cartRepository.update(cart.id, {}),
        ]),
        Effect.map(() => undefined),
      );

    return pipe(
      getCartAndProductEffect(command),
      Effect.flatMap(deleteCartItemEffect),
      Effect.catchAll(Effect.fail),
    );
  }
}
