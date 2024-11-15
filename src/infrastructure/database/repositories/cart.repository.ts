import { Injectable } from '@nestjs/common';
import { Cart, Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import { AppNotFoundException } from 'src/domain/exceptions';
import { CartModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';
@Injectable()
export class CartRepository implements BaseRepository<Cart, CartModel> {
  constructor(private readonly prismaClient: PrismaService) {}

  create(
    data: Prisma.CartCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartModel, Error> {
    const prisma = transaction ?? this.prismaClient;

    const createPromise = Effect.tryPromise(() => prisma.cart.create({ data }));

    return pipe(createPromise, Effect.map(CartModel.from));
  }

  update(
    id: number,
    data: Prisma.CartUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const updatePromise = Effect.tryPromise(() =>
      prisma.cart.update({ where: { id }, data }),
    );

    return pipe(updatePromise, Effect.map(CartModel.from));
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const deletePromise = Effect.tryPromise(() =>
      prisma.cart.delete({ where: { id } }),
    );

    return pipe(
      deletePromise,
      Effect.map(() => undefined),
    );
  }

  findOneBy(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;
    const findPromise = Effect.tryPromise(() =>
      prisma.cart.findUnique({ where: { id } }),
    );

    return pipe(
      findPromise,
      Effect.map((cart) => (cart ? CartModel.from(cart) : null)),
    );
  }

  findByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;
    const findPromise = Effect.tryPromise(() =>
      prisma.cart.findUnique({ where: { userId } }),
    );

    return pipe(
      findPromise,
      Effect.map((cart) => (cart ? CartModel.from(cart) : null)),
    );
  }

  getById(
    cartId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartModel, AppNotFoundException> {
    const prisma = transaction ?? this.prismaClient;
    const findPromise = Effect.tryPromise(() =>
      prisma.cart.findUniqueOrThrow({ where: { id: cartId } }),
    );

    return pipe(
      findPromise,
      Effect.map(CartModel.from),
      Effect.catchAll(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.CART_NOT_FOUND)),
      ),
    );
  }

  getByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartModel, AppNotFoundException> {
    const prisma = transaction ?? this.prismaClient;
    const findPromise = Effect.tryPromise(() =>
      prisma.cart.findUniqueOrThrow({ where: { userId } }),
    );

    return pipe(
      findPromise,
      Effect.map(CartModel.from),
      Effect.catchAll(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.CART_NOT_FOUND)),
      ),
    );
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const findPromise = Effect.tryPromise(() => prisma.cart.findMany());

    return pipe(
      findPromise,
      Effect.map((carts) => carts.map(CartModel.from)),
    );
  }
}
