import { Injectable } from '@nestjs/common';
import { Point, Prisma } from '@prisma/client';
import { Effect } from 'effect';
import { PointModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class PointRepository implements BaseRepository<Point, PointModel> {
  constructor(private readonly prismaClient: PrismaService) {}

  create(
    data: Prisma.PointUncheckedCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PointModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const createPromise = prisma.point.create({ data });

    return Effect.promise(() => createPromise).pipe(
      Effect.map(PointModel.from),
    );
  }

  update(
    id: number,
    data: Prisma.PointUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PointModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const updatePromise = prisma.point.update({ where: { id }, data });

    return Effect.promise(() => updatePromise).pipe(
      Effect.map(PointModel.from),
    );
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const deletePromise = prisma.point.delete({ where: { id } });

    return Effect.promise(() => deletePromise);
  }

  findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PointModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;
    const pointPromise = prisma.point.findUnique({ where: { id } });

    return Effect.promise(() => pointPromise).pipe(
      Effect.map((point) => (point ? PointModel.from(point) : null)),
    );
  }

  getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PointModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const pointPromise = prisma.point.findUniqueOrThrow({ where: { id } });

    return Effect.promise(() => pointPromise).pipe(Effect.map(PointModel.from));
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PointModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const pointListPromise = prisma.point.findMany();

    return Effect.promise(() => pointListPromise).pipe(
      Effect.map((points) => points.map(PointModel.from)),
    );
  }

  findByWalletId(
    walletId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PointModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const pointListPromise = prisma.point.findMany({ where: { walletId } });

    return Effect.promise(() => pointListPromise).pipe(
      Effect.map((points) => points.map(PointModel.from)),
    );
  }
}
