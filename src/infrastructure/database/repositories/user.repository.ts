import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import {
  AppConflictException,
  AppNotFoundException,
} from 'src/domain/exceptions';
import { UserModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class UserRepository implements BaseRepository<User, UserModel> {
  constructor(private readonly prismaClient: PrismaService) {}

  create(
    data: Prisma.UserCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<UserModel, AppConflictException> {
    const prisma = transaction ?? this.prismaClient;
    const userPromise = Effect.tryPromise(() => prisma.user.create({ data }));

    return pipe(
      userPromise,
      Effect.map(UserModel.from),
      Effect.catchAll(() =>
        Effect.fail(new AppConflictException(ErrorCodes.USER_ALREADY_EXISTS)),
      ),
    );
  }

  update(
    id: number,
    data: User,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<UserModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const userPromise = Effect.tryPromise(() =>
      prisma.user.update({ where: { id }, data }),
    );

    return pipe(
      userPromise,
      Effect.map(UserModel.from),
      Effect.catchAll(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.USER_NOT_FOUND)),
      ),
    );
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const deletePromise = Effect.tryPromise(() =>
      prisma.user.delete({ where: { id } }),
    );

    return pipe(
      deletePromise,
      Effect.map(() => void 0),
    );
  }

  findOneBy(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<UserModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;
    const userPromise = Effect.tryPromise(() =>
      prisma.user.findUnique({ where: { id } }),
    );

    return pipe(
      userPromise,
      Effect.map((user) => (user ? UserModel.from(user) : null)),
    );
  }

  getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<UserModel, AppNotFoundException> {
    const prisma = transaction ?? this.prismaClient;
    const userPromise = Effect.tryPromise(() =>
      prisma.user.findUniqueOrThrow({ where: { id } }),
    );

    return pipe(
      userPromise,
      Effect.map(UserModel.from),
      Effect.catchAll(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.USER_NOT_FOUND)),
      ),
    );
  }

  getByEmail(email: string): Effect.Effect<UserModel, AppNotFoundException> {
    const userPromise = Effect.tryPromise(() =>
      this.prismaClient.user.findUniqueOrThrow({
        where: { email },
      }),
    );

    return pipe(
      userPromise,
      Effect.map(UserModel.from),
      Effect.catchAll(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.USER_NOT_FOUND)),
      ),
    );
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<UserModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const usersPromise = Effect.tryPromise(() => prisma.user.findMany());

    return pipe(
      usersPromise,
      Effect.map((users) => users.map(UserModel.from)),
    );
  }
}
