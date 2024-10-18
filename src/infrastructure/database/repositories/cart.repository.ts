import { Injectable } from '@nestjs/common';
import { Cart, Prisma } from '@prisma/client';
import { CartDomain } from 'src/domain';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class CartRepository implements BaseRepository<Cart, CartDomain> {
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: Cart,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartDomain> {
    const prisma = transaction ?? this.prismaClient;
    const cart = await prisma.cart.create({ data });

    return new CartDomain(cart.id, cart.userId, cart.createdAt, cart.updatedAt);
  }

  async update(
    id: number,
    data: Prisma.CartUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartDomain> {
    const prisma = transaction ?? this.prismaClient;
    const cart = await prisma.cart.update({ where: { id }, data });

    return new CartDomain(cart.id, cart.userId, cart.createdAt, cart.updatedAt);
  }

  async delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = transaction ?? this.prismaClient;
    await prisma.cart.delete({ where: { id } });
    return;
  }

  async findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartDomain | null> {
    const prisma = transaction ?? this.prismaClient;
    const cart = await prisma.cart.findUnique({ where: { id } });

    if (!cart) return null;

    return new CartDomain(cart.id, cart.userId, cart.createdAt, cart.updatedAt);
  }

  async findByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartDomain | null> {
    const prisma = transaction ?? this.prismaClient;
    const cart = await prisma.cart.findUnique({ where: { userId } });

    if (!cart) return null;

    return new CartDomain(cart.id, cart.userId, cart.createdAt, cart.updatedAt);
  }

  async getById(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartDomain> {
    const prisma = transaction ?? this.prismaClient;
    const cart = await prisma.cart.findUniqueOrThrow({ where: { userId } });

    return new CartDomain(cart.id, cart.userId, cart.createdAt, cart.updatedAt);
  }

  async getByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartDomain> {
    const prisma = transaction ?? this.prismaClient;
    const cart = await prisma.cart.findUniqueOrThrow({ where: { userId } });
    return new CartDomain(cart.id, cart.userId, cart.createdAt, cart.updatedAt);
  }

  async findAll(transaction?: Prisma.TransactionClient): Promise<CartDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const carts = await prisma.cart.findMany();

    return carts.map(
      (cart) =>
        new CartDomain(cart.id, cart.userId, cart.createdAt, cart.updatedAt),
    );
  }
}
