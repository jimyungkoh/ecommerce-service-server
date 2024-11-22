import { CartItem, Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import { AppNotFoundException } from 'src/domain/exceptions';
import { CartItemModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';
import { Infrastructure } from '../../../common/decorators';

@Infrastructure()
export class CartItemRepository
  implements BaseRepository<CartItem, CartItemModel>
{
  constructor(private readonly prismaClient: PrismaService) {}

  create(
    data: Prisma.CartItemCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartItemModel, Error> {
    const prisma = transaction ?? this.prismaClient;

    const createPromise = Effect.tryPromise(() =>
      prisma.cartItem.create({ data }),
    );

    return pipe(createPromise, Effect.map(CartItemModel.from));
  }

  update(
    id: number,
    data: Prisma.CartItemUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartItemModel, Error> {
    const prisma = transaction ?? this.prismaClient;

    const updatePromise = Effect.tryPromise(() =>
      prisma.cartItem.update({
        where: {
          id,
        },
        data,
      }),
    );

    return pipe(updatePromise, Effect.map(CartItemModel.from));
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;

    const deletePromise = Effect.tryPromise(() =>
      prisma.cartItem.delete({ where: { id } }),
    );

    return pipe(
      deletePromise,
      Effect.map(() => undefined),
    );
  }

  deleteByCartIdAndProductId(
    cartId: number,
    productId: number,
    transaction?: Prisma.TransactionClient,
  ) {
    const prisma = transaction ?? this.prismaClient;

    const deletePromise = Effect.tryPromise(() =>
      prisma.cartItem.delete({
        where: { idx_cart_item_cart_id_product_id: { cartId, productId } },
      }),
    );

    return pipe(
      deletePromise,
      Effect.map(() => undefined),
      Effect.catchAll(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.CART_ITEM_NOT_FOUND)),
      ),
    );
  }

  findOneBy(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartItemModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;

    const findPromise = Effect.tryPromise(() =>
      prisma.cartItem.findUnique({ where: { id } }),
    );

    return pipe(
      findPromise,
      Effect.map((cartItem) =>
        cartItem ? CartItemModel.from(cartItem) : null,
      ),
    );
  }

  getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartItemModel, Error> {
    const prisma = transaction ?? this.prismaClient;

    const findPromise = Effect.tryPromise(() =>
      prisma.cartItem.findUniqueOrThrow({ where: { id } }),
    );

    return pipe(findPromise, Effect.map(CartItemModel.from));
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartItemModel[], Error> {
    const prisma = transaction ?? this.prismaClient;

    const findPromise = Effect.tryPromise(() => prisma.cartItem.findMany());

    return pipe(findPromise, Effect.map(CartItemModel.fromList));
  }

  findByCartId(
    cartId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartItemModel[], Error> {
    const prisma = transaction ?? this.prismaClient;

    const findPromise = Effect.tryPromise(() =>
      prisma.cartItem.findMany({ where: { cartId } }),
    );

    return pipe(findPromise, Effect.map(CartItemModel.fromList));
  }

  findByProductId(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartItemModel[], Error> {
    const prisma = transaction ?? this.prismaClient;

    const findPromise = Effect.tryPromise(() =>
      prisma.cartItem.findMany({ where: { productId } }),
    );

    return pipe(findPromise, Effect.map(CartItemModel.fromList));
  }

  deleteByCartId(
    cartId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<number, Error> {
    const prisma = transaction ?? this.prismaClient;

    const deletePromise = Effect.tryPromise(() =>
      prisma.cartItem.deleteMany({ where: { cartId } }),
    );

    return pipe(
      deletePromise,
      Effect.map((result) => result.count),
    );
  }
}
