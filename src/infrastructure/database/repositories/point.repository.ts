import { Injectable } from '@nestjs/common';
import { Point, Prisma } from '@prisma/client';
import { PointDomain } from 'src/infrastructure/dtos/domains';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class PointRepository implements BaseRepository<Point, PointDomain> {
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: Prisma.PointUncheckedCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<PointDomain> {
    const prisma = transaction ?? this.prismaClient;
    const point = await prisma.point.create({ data });
    return new PointDomain({
      id: point.id,
      walletId: point.walletId,
      amount: point.amount,
      transactionType: point.transactionType,
      createdAt: point.createdAt,
      updatedAt: point.updatedAt,
      expiredAt: point.expiredAt,
    });
  }

  async update(
    id: number,
    data: Prisma.PointUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<PointDomain> {
    const prisma = transaction ?? this.prismaClient;
    const point = await prisma.point.update({ where: { id }, data });

    return new PointDomain({
      id: point.id,
      walletId: point.walletId,
      amount: point.amount,
      transactionType: point.transactionType,
      createdAt: point.createdAt,
      updatedAt: point.updatedAt,
      expiredAt: point.expiredAt,
    });
  }

  async delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = transaction ?? this.prismaClient;
    await prisma.point.delete({ where: { id } });
  }

  async findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<PointDomain | null> {
    const prisma = transaction ?? this.prismaClient;
    const point = await prisma.point.findUnique({ where: { id } });

    if (!point) return null;

    return new PointDomain({
      id: point.id,
      walletId: point.walletId,
      amount: point.amount,
      transactionType: point.transactionType,
      createdAt: point.createdAt,
      updatedAt: point.updatedAt,
      expiredAt: point.expiredAt,
    });
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<PointDomain> {
    const prisma = transaction ?? this.prismaClient;
    const point = await prisma.point.findUniqueOrThrow({ where: { id } });
    return new PointDomain({
      id: point.id,
      walletId: point.walletId,
      amount: point.amount,
      transactionType: point.transactionType,
      createdAt: point.createdAt,
      updatedAt: point.updatedAt,
      expiredAt: point.expiredAt,
    });
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<PointDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const pointList = await prisma.point.findMany();

    return pointList.map(
      (point) =>
        new PointDomain({
          id: point.id,
          walletId: point.walletId,
          amount: point.amount,
          transactionType: point.transactionType,
          createdAt: point.createdAt,
          updatedAt: point.updatedAt,
          expiredAt: point.expiredAt,
        }),
    );
  }

  async findByWalletId(
    walletId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<PointDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const pointList = await prisma.point.findMany({ where: { walletId } });

    return pointList.map(
      (point) =>
        new PointDomain({
          id: point.id,
          walletId: point.walletId,
          amount: point.amount,
          transactionType: point.transactionType,
          createdAt: point.createdAt,
          updatedAt: point.updatedAt,
          expiredAt: point.expiredAt,
        }),
    );
  }
}
