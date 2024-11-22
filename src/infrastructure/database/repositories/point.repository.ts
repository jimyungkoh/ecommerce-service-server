import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { PointModel } from 'src/domain/models';
import { CreatePointParam } from 'src/infrastructure/dto';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';
import { Infrastructure } from '../../../common/decorators';

@Infrastructure()
export class PointRepository implements BaseRepository<PointModel, PointModel> {
  constructor(private readonly prismaClient: PrismaService) {}

  create(
    data: CreatePointParam,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PointModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const createPointEffect = Effect.tryPromise(() =>
      prisma.point.create({
        data,
      }),
    );

    return pipe(createPointEffect, Effect.map(PointModel.from));
  }

  update(
    id: number,
    data: Prisma.PointUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PointModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const updatePointEffect = Effect.tryPromise(() =>
      prisma.point.update({ where: { id }, data }),
    );

    return pipe(updatePointEffect, Effect.map(PointModel.from));
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const deletePointEffect = () =>
      Effect.tryPromise(() => prisma.point.delete({ where: { id } }));

    return deletePointEffect();
  }

  findOneBy(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PointModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;
    const pointPromise = Effect.tryPromise(() =>
      prisma.point.findUnique({ where: { id } }),
    );

    return pipe(
      pointPromise,
      Effect.map((point) => (point ? PointModel.from(point) : null)),
    );
  }

  getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PointModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const pointPromise = Effect.tryPromise(() =>
      prisma.point.findUniqueOrThrow({ where: { id } }),
    );

    return pipe(pointPromise, Effect.map(PointModel.from));
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PointModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const pointListPromise = Effect.tryPromise(() => prisma.point.findMany());

    return pipe(
      pointListPromise,
      Effect.map((points) => points.map(PointModel.from)),
    );
  }

  findByWalletId(
    walletId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<PointModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const pointListPromise = Effect.tryPromise(() =>
      prisma.point.findMany({ where: { walletId } }),
    );

    return pipe(
      pointListPromise,
      Effect.map((points) => points.map(PointModel.from)),
    );
  }
}
