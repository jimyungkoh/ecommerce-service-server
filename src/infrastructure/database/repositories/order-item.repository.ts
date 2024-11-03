import { Injectable } from '@nestjs/common';
import { OrderItem, Prisma } from '@prisma/client';
import { OrderItemModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class OrderItemRepository
  implements BaseRepository<OrderItem, OrderItemModel>
{
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: Prisma.OrderItemCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderItemModel> {
    const prisma = transaction ?? this.prismaClient;
    const orderItem = await prisma.orderItem.create({ data });
    return OrderItemModel.from(orderItem);
  }

  async update(
    id: number,
    data: Prisma.OrderItemUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderItemModel> {
    const prisma = transaction ?? this.prismaClient;
    const orderItem = await prisma.orderItem.update({ where: { id }, data });
    return OrderItemModel.from(orderItem);
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
  ): Promise<OrderItemModel | null> {
    const prisma = transaction ?? this.prismaClient;
    const orderItem = await prisma.orderItem.findUnique({ where: { id } });

    if (!orderItem) return null;

    return OrderItemModel.from(orderItem);
  }

  async findByOrderId(
    orderId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderItemModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const orderItems = await prisma.orderItem.findMany({ where: { orderId } });
    return orderItems.map(OrderItemModel.from);
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderItemModel> {
    const prisma = transaction ?? this.prismaClient;
    const orderItem = await prisma.orderItem.findUniqueOrThrow({
      where: { id },
    });
    return OrderItemModel.from(orderItem);
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderItemModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const orderItems = await prisma.orderItem.findMany();
    return orderItems.map(OrderItemModel.from);
  }
}
