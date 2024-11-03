import { Injectable } from '@nestjs/common';
import { Point, Prisma } from '@prisma/client';
import { PointModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class PointRepository implements BaseRepository<Point, PointModel> {
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: Prisma.PointUncheckedCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<PointModel> {
    const prisma = transaction ?? this.prismaClient;
    const point = await prisma.point.create({ data });
    return PointModel.from(point);
  }

  async update(
    id: number,
    data: Prisma.PointUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<PointModel> {
    const prisma = transaction ?? this.prismaClient;
    const point = await prisma.point.update({ where: { id }, data });

    return PointModel.from(point);
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
  ): Promise<PointModel | null> {
    const prisma = transaction ?? this.prismaClient;
    const point = await prisma.point.findUnique({ where: { id } });

    if (!point) return null;

    return PointModel.from(point);
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<PointModel> {
    const prisma = transaction ?? this.prismaClient;
    const point = await prisma.point.findUniqueOrThrow({ where: { id } });
    return PointModel.from(point);
  }

  async findAll(transaction?: Prisma.TransactionClient): Promise<PointModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const pointList = await prisma.point.findMany();

    return pointList.map(PointModel.from);
  }

  async findByWalletId(
    walletId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<PointModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const pointList = await prisma.point.findMany({ where: { walletId } });

    return pointList.map(PointModel.from);
  }
}
