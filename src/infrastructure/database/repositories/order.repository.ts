import { Injectable } from '@nestjs/common';
import { Order, OrderStatus, Prisma } from '@prisma/client';
import { OrderDomain } from 'src/domain';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class OrderRepository implements BaseRepository<Order, OrderDomain> {
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: Prisma.OrderCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderDomain> {
    const prisma = transaction ?? this.prismaClient;
    const order = await prisma.order.create({ data });
    return new OrderDomain(
      order.id,
      order.userId,
      order.status,
      order.createdAt,
      order.updatedAt,
    );
  }

  async update(
    id: bigint,
    data: Prisma.OrderUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderDomain> {
    const prisma = transaction ?? this.prismaClient;
    const order = await prisma.order.update({
      where: { id },
      data,
    });
    return new OrderDomain(
      order.id,
      order.userId,
      order.status,
      order.createdAt,
      order.updatedAt,
    );
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
  ): Promise<OrderDomain | null> {
    const prisma = transaction ?? this.prismaClient;

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) return null;

    return new OrderDomain(
      order.id,
      order.userId,
      order.status,
      order.createdAt,
      order.updatedAt,
    );
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderDomain> {
    const prisma = transaction ?? this.prismaClient;
    const order = await prisma.order.findUniqueOrThrow({ where: { id } });
    return new OrderDomain(
      order.id,
      order.userId,
      order.status,
      order.createdAt,
      order.updatedAt,
    );
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const orders = await prisma.order.findMany();
    return orders.map(
      (order) =>
        new OrderDomain(
          order.id,
          order.userId,
          order.status,
          order.createdAt,
          order.updatedAt,
        ),
    );
  }

  async findByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const orders = await prisma.order.findMany({ where: { userId } });
    return orders.map(
      (order) =>
        new OrderDomain(
          order.id,
          order.userId,
          order.status,
          order.createdAt,
          order.updatedAt,
        ),
    );
  }

  async findByUserIdAndOrderStatus(
    userId: number,
    status: OrderStatus,
    transaction?: Prisma.TransactionClient,
  ): Promise<OrderDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const orders = await prisma.order.findMany({ where: { userId, status } });
    return orders.map(
      (order) =>
        new OrderDomain(
          order.id,
          order.userId,
          order.status,
          order.createdAt,
          order.updatedAt,
        ),
    );
  }
}
