import { Injectable } from '@nestjs/common';
import { Cart, Prisma } from '@prisma/client';
import { Effect } from 'effect';
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

    const createPromise = prisma.cart.create({ data });

    return Effect.promise(() => createPromise).pipe(Effect.map(CartModel.from));
  }

  update(
    id: number,
    data: Prisma.CartUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const updatePromise = prisma.cart.update({ where: { id }, data });

    return Effect.promise(() => updatePromise).pipe(Effect.map(CartModel.from));
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const deletePromise = prisma.cart.delete({ where: { id } });

    return Effect.promise(() => deletePromise);
  }

  findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;

    const findPromise = prisma.cart.findUnique({ where: { id } });

    return Effect.promise(() => findPromise).pipe(
      Effect.map((cart) => (cart ? CartModel.from(cart) : null)),
    );
  }

  findByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;
    const findPromise = prisma.cart.findUnique({ where: { userId } });

    return Effect.promise(() => findPromise).pipe(
      Effect.map((cart) => (cart ? CartModel.from(cart) : null)),
    );
  }

  getById(
    cartId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const findPromise = prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
    });

    return Effect.promise(() => findPromise).pipe(Effect.map(CartModel.from));
  }

  getByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const findPromise = prisma.cart.findUniqueOrThrow({ where: { userId } });

    return Effect.promise(() => findPromise).pipe(Effect.map(CartModel.from));
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<CartModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const findPromise = prisma.cart.findMany();

    return Effect.promise(() => findPromise).pipe(
      Effect.map((carts) => carts.map(CartModel.from)),
    );
  }
}
