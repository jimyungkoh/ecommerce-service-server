import { Injectable } from '@nestjs/common';
import { CartItem, Prisma } from '@prisma/client';
import { CartItemDomain } from 'src/domain';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class CartItemRepository
  implements BaseRepository<CartItem, CartItemDomain>
{
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: Prisma.CartItemCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartItemDomain> {
    const prisma = transaction ?? this.prismaClient;
    const cartItem = await prisma.cartItem.create({ data });

    return new CartItemDomain(
      cartItem.id,
      cartItem.cartId,
      cartItem.productId,
      cartItem.quantity,
      cartItem.createdAt,
      cartItem.updatedAt,
    );
  }

  async update(
    id: number,
    data: Prisma.CartItemUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartItemDomain> {
    const prisma = transaction ?? this.prismaClient;
    const cartItem = await prisma.cartItem.update({ where: { id }, data });
    return new CartItemDomain(
      cartItem.id,
      cartItem.cartId,
      cartItem.productId,
      cartItem.quantity,
      cartItem.createdAt,
      cartItem.updatedAt,
    );
  }

  async delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartItemDomain> {
    const prisma = transaction ?? this.prismaClient;
    const cartItem = await prisma.cartItem.delete({ where: { id } });
    return new CartItemDomain(
      cartItem.id,
      cartItem.cartId,
      cartItem.productId,
      cartItem.quantity,
      cartItem.createdAt,
      cartItem.updatedAt,
    );
  }

  async deleteByCartIdAndProductId(
    cartId: number,
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = transaction ?? this.prismaClient;
    await prisma.cartItem.delete({
      where: { idx_cart_item_cart_id_product_id: { cartId, productId } },
    });
  }

  async findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartItemDomain | null> {
    const prisma = transaction ?? this.prismaClient;
    const cartItem = await prisma.cartItem.findUnique({ where: { id } });
    return cartItem
      ? new CartItemDomain(
          cartItem.id,
          cartItem.cartId,
          cartItem.productId,
          cartItem.quantity,
          cartItem.createdAt,
          cartItem.updatedAt,
        )
      : null;
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartItemDomain> {
    const prisma = transaction ?? this.prismaClient;
    const cartItem = await prisma.cartItem.findUniqueOrThrow({ where: { id } });
    return new CartItemDomain(
      cartItem.id,
      cartItem.cartId,
      cartItem.productId,
      cartItem.quantity,
      cartItem.createdAt,
      cartItem.updatedAt,
    );
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<CartItemDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const cartItems = await prisma.cartItem.findMany();
    return cartItems.map(
      (cartItem) =>
        new CartItemDomain(
          cartItem.id,
          cartItem.cartId,
          cartItem.productId,
          cartItem.quantity,
          cartItem.createdAt,
          cartItem.updatedAt,
        ),
    );
  }

  async findByCartId(
    cartId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartItemDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const cartItems = await prisma.cartItem.findMany({ where: { cartId } });
    return cartItems.map(
      (cartItem) =>
        new CartItemDomain(
          cartItem.id,
          cartItem.cartId,
          cartItem.productId,
          cartItem.quantity,
          cartItem.createdAt,
          cartItem.updatedAt,
        ),
    );
  }

  async findByProductId(
    productId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<CartItemDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const cartItems = await prisma.cartItem.findMany({ where: { productId } });
    return cartItems.map(
      (cartItem) =>
        new CartItemDomain(
          cartItem.id,
          cartItem.cartId,
          cartItem.productId,
          cartItem.quantity,
          cartItem.createdAt,
          cartItem.updatedAt,
        ),
    );
  }

  async deleteByCartId(
    cartId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = transaction ?? this.prismaClient;
    return (await prisma.cartItem.deleteMany({ where: { cartId } })).count;
  }
}
