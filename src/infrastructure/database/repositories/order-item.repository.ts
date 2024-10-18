import { Injectable } from '@nestjs/common';
import { OrderItem, Prisma } from '@prisma/client';
import { OrderItemDomain } from 'src/domain';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class OrderItemRepository
  implements BaseRepository<OrderItem, OrderItemDomain>
{
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: Prisma.OrderItemCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderItemDomain> {
    const prisma = transaction ?? this.prismaClient;
    const orderItem = await prisma.orderItem.create({ data });
    return new OrderItemDomain(
      orderItem.id,
      orderItem.orderId,
      orderItem.productId,
      orderItem.quantity,
      orderItem.price,
      orderItem.createdAt,
      orderItem.updatedAt,
    );
  }

  async update(
    id: number,
    data: OrderItem,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderItemDomain> {
    const prisma = transaction ?? this.prismaClient;
    const orderItem = await prisma.orderItem.update({ where: { id }, data });
    return new OrderItemDomain(
      orderItem.id,
      orderItem.orderId,
      orderItem.productId,
      orderItem.quantity,
      orderItem.price,
      orderItem.createdAt,
      orderItem.updatedAt,
    );
  }

  async delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = transaction ?? this.prismaClient;
    await prisma.orderItem.delete({ where: { id } });
  }

  async findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderItemDomain | null> {
    const prisma = transaction ?? this.prismaClient;
    const orderItem = await prisma.orderItem.findUnique({ where: { id } });

    if (!orderItem) return null;

    return new OrderItemDomain(
      orderItem.id,
      orderItem.orderId,
      orderItem.productId,
      orderItem.quantity,
      orderItem.price,
      orderItem.createdAt,
      orderItem.updatedAt,
    );
  }

  async findByOrderId(
    orderId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderItemDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const orderItems = await prisma.orderItem.findMany({ where: { orderId } });
    return orderItems.map(
      (orderItem) =>
        new OrderItemDomain(
          orderItem.id,
          orderItem.orderId,
          orderItem.productId,
          orderItem.quantity,
          orderItem.price,
          orderItem.createdAt,
          orderItem.updatedAt,
        ),
    );
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderItemDomain> {
    const prisma = transaction ?? this.prismaClient;
    const orderItem = await prisma.orderItem.findUniqueOrThrow({
      where: { id },
    });
    return new OrderItemDomain(
      orderItem.id,
      orderItem.orderId,
      orderItem.productId,
      orderItem.quantity,
      orderItem.price,
      orderItem.createdAt,
      orderItem.updatedAt,
    );
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderItemDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const orderItems = await prisma.orderItem.findMany();
    return orderItems.map(
      (orderItem) =>
        new OrderItemDomain(
          orderItem.id,
          orderItem.orderId,
          orderItem.productId,
          orderItem.quantity,
          orderItem.price,
          orderItem.createdAt,
          orderItem.updatedAt,
        ),
    );
  }
}
