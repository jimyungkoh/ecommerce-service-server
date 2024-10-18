import { Injectable } from '@nestjs/common';
import { Point, Prisma } from '@prisma/client';
import { PointDomain } from 'src/domain';
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
    return new PointDomain(
      point.id,
      point.walletId,
      point.amount,
      point.transactionType,
      point.createdAt,
      point.updatedAt,
      point.expiredAt,
    );
  }

  async update(
    id: number,
    data: Prisma.PointUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<PointDomain> {
    const prisma = transaction ?? this.prismaClient;
    const point = await prisma.point.update({ where: { id }, data });

    return new PointDomain(
      point.id,
      point.walletId,
      point.amount,
      point.transactionType,
      point.createdAt,
      point.updatedAt,
      point.expiredAt,
    );
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

    return new PointDomain(
      point.id,
      point.walletId,
      point.amount,
      point.transactionType,
      point.createdAt,
      point.updatedAt,
      point.expiredAt,
    );
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<PointDomain> {
    const prisma = transaction ?? this.prismaClient;
    const point = await prisma.point.findUniqueOrThrow({ where: { id } });
    return new PointDomain(
      point.id,
      point.walletId,
      point.amount,
      point.transactionType,
      point.createdAt,
      point.updatedAt,
      point.expiredAt,
    );
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<PointDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const pointList = await prisma.point.findMany();

    return pointList.map(
      (point) =>
        new PointDomain(
          point.id,
          point.walletId,
          point.amount,
          point.transactionType,
          point.createdAt,
          point.updatedAt,
          point.expiredAt,
        ),
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
        new PointDomain(
          point.id,
          point.walletId,
          point.amount,
          point.transactionType,
          point.createdAt,
          point.updatedAt,
          point.expiredAt,
        ),
    );
  }
}
