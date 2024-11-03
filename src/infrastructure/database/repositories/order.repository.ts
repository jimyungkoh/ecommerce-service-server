import { Injectable } from '@nestjs/common';
import { Order, OrderStatus, Prisma } from '@prisma/client';
import { OrderModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class OrderRepository implements BaseRepository<Order, OrderModel> {
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: Prisma.OrderCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderModel> {
    const prisma = transaction ?? this.prismaClient;
    const order = await prisma.order.create({ data });
    return OrderModel.from(order);
  }

  async update(
    id: number,
    data: Prisma.OrderUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderModel> {
    const prisma = transaction ?? this.prismaClient;
    const order = await prisma.order.update({
      where: { id },
      data,
    });
    return OrderModel.from(order);
  }

  async delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = transaction ?? this.prismaClient;
    await prisma.order.delete({ where: { id } });
  }

  async findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderModel | null> {
    const prisma = transaction ?? this.prismaClient;

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) return null;

    return OrderModel.from(order);
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderModel> {
    const prisma = transaction ?? this.prismaClient;
    const order = await prisma.order.findUniqueOrThrow({ where: { id } });
    return OrderModel.from(order);
  }

  async findAll(transaction?: Prisma.TransactionClient): Promise<OrderModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const orders = await prisma.order.findMany();
    return orders.map(OrderModel.from);
  }

  async findByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const orders = await prisma.order.findMany({ where: { userId } });
    return orders.map(OrderModel.from);
  }

  async findByUserIdAndOrderStatus(
    userId: number,
    status: OrderStatus,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const orders = await prisma.order.findMany({ where: { userId, status } });
    return orders.map(OrderModel.from);
  }
}
