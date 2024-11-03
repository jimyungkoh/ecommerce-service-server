import { Injectable } from '@nestjs/common';
import { CartItem, Prisma } from '@prisma/client';
import { Effect } from 'effect';
import { CartItemModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';
@Injectable()
export class CartItemRepository
  implements BaseRepository<CartItem, CartItemModel>
{
  constructor(private readonly prismaClient: PrismaService) {}

  create(
    data: Prisma.CartItemCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartItemModel, Error> {
    const prisma = transaction ?? this.prismaClient;

    const createPromise = prisma.cartItem.create({ data });

    return Effect.promise(() => createPromise).pipe(
      Effect.map(CartItemModel.from),
    );
  }

  update(
    id: number,
    data: Prisma.CartItemUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartItemModel, Error> {
    const prisma = transaction ?? this.prismaClient;

    const updatePromise = prisma.cartItem.update({
      where: {
        id,
      },
      data,
    });

    return Effect.promise(() => updatePromise).pipe(
      Effect.map(CartItemModel.from),
    );
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;

    const deletePromise = prisma.cartItem.delete({ where: { id } });

    return Effect.promise(() => deletePromise).pipe(
      Effect.map(() => undefined),
    );
  }

  deleteByCartIdAndProductId(
    cartId: number,
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;

    const deletePromise = prisma.cartItem.delete({
      where: { idx_cart_item_cart_id_product_id: { cartId, productId } },
    });

    return Effect.promise(() => deletePromise).pipe(
      Effect.map(() => undefined),
    );
  }

  findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartItemModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;

    const findPromise = prisma.cartItem.findUnique({ where: { id } });

    return Effect.promise(() => findPromise).pipe(
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

    const findPromise = prisma.cartItem.findUniqueOrThrow({ where: { id } });

    return Effect.promise(() => findPromise).pipe(
      Effect.map(CartItemModel.from),
    );
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartItemModel[], Error> {
    const prisma = transaction ?? this.prismaClient;

    const findPromise = prisma.cartItem.findMany();

    return Effect.promise(() => findPromise).pipe(
      Effect.map((cartItems) => cartItems.map(CartItemModel.from)),
    );
  }

  findByCartId(
    cartId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartItemModel[], Error> {
    const prisma = transaction ?? this.prismaClient;

    const findPromise = prisma.cartItem.findMany({ where: { cartId } });

    return Effect.promise(() => findPromise).pipe(
      Effect.map((cartItems) => cartItems.map(CartItemModel.from)),
    );
  }

  findByProductId(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartItemModel[], Error> {
    const prisma = transaction ?? this.prismaClient;

    const findPromise = prisma.cartItem.findMany({ where: { productId } });

    return Effect.promise(() => findPromise).pipe(
      Effect.map((cartItems) => cartItems.map(CartItemModel.from)),
    );
  }

  deleteByCartId(
    cartId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<number, Error> {
    const prisma = transaction ?? this.prismaClient;

    const deletePromise = prisma.cartItem.deleteMany({ where: { cartId } });

    return Effect.promise(() => deletePromise).pipe(
      Effect.map((result) => result.count),
    );
  }
}
