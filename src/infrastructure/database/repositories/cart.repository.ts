import { Injectable } from '@nestjs/common';
import { Cart, Prisma } from '@prisma/client';
import { CartModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';
@Injectable()
export class CartRepository implements BaseRepository<Cart, CartModel> {
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: Prisma.CartCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartModel> {
    const prisma = transaction ?? this.prismaClient;
    const cart = await prisma.cart.create({ data });

    return CartModel.from(cart);
  }

  async update(
    id: number,
    data: Prisma.CartUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartModel> {
    const prisma = transaction ?? this.prismaClient;
    const cart = await prisma.cart.update({ where: { id }, data });

    return CartModel.from(cart);
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
  ): Promise<CartModel | null> {
    const prisma = transaction ?? this.prismaClient;

    const cart = await prisma.cart.findUnique({ where: { id } });
    if (!cart) return null;

    return CartModel.from(cart);
  }

  async findByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartModel | null> {
    const prisma = transaction ?? this.prismaClient;
    const cart = await prisma.cart.findUnique({ where: { userId } });

    if (!cart) return null;

    return CartModel.from(cart);
  }

  async getById(
    cartId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartModel> {
    const prisma = transaction ?? this.prismaClient;
    const cart = await prisma.cart.findUniqueOrThrow({ where: { id: cartId } });

    return CartModel.from(cart);
  }

  async getByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartModel> {
    const prisma = transaction ?? this.prismaClient;
    const cart = await prisma.cart.findUniqueOrThrow({ where: { userId } });
    return CartModel.from(cart);
  }

  async findAll(transaction?: Prisma.TransactionClient): Promise<CartModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const carts = await prisma.cart.findMany();

    return carts.map(CartModel.from);
  }
}
