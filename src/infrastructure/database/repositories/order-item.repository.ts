import { Injectable } from '@nestjs/common';
import { OrderItem, Prisma } from '@prisma/client';
import { OrderItemDomain } from 'src/infrastructure/dtos/domains';
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
    return OrderItemDomain.from(orderItem);
  }

  async update(
    id: number,
    data: Prisma.OrderItemUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderItemDomain> {
    const prisma = transaction ?? this.prismaClient;
    const orderItem = await prisma.orderItem.update({ where: { id }, data });
    return OrderItemDomain.from(orderItem);
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

    return OrderItemDomain.from(orderItem);
  }

  async findByOrderId(
    orderId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderItemDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const orderItems = await prisma.orderItem.findMany({ where: { orderId } });
    return orderItems.map(OrderItemDomain.from);
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderItemDomain> {
    const prisma = transaction ?? this.prismaClient;
    const orderItem = await prisma.orderItem.findUniqueOrThrow({
      where: { id },
    });
    return OrderItemDomain.from(orderItem);
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderItemDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const orderItems = await prisma.orderItem.findMany();
    return orderItems.map(OrderItemDomain.from);
  }
}
