import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { Effect } from 'effect';
import { UserModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class UserRepository implements BaseRepository<User, UserModel> {
  constructor(private readonly prismaClient: PrismaService) {}

  create(
    data: Prisma.UserCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<UserModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const userPromise = prisma.user.create({ data });

    return Effect.promise(() => userPromise).pipe(Effect.map(UserModel.from));
  }

  update(
    id: number,
    data: User,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<UserModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const userPromise = prisma.user.update({ where: { id }, data });

    return Effect.promise(() => userPromise).pipe(Effect.map(UserModel.from));
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const deletePromise = prisma.user.delete({ where: { id } });

    return Effect.promise(() => deletePromise);
  }

  findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<UserModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;
    const userPromise = prisma.user.findUnique({ where: { id } });

    return Effect.promise(() => userPromise).pipe(
      Effect.map((user) => (user ? UserModel.from(user) : null)),
    );
  }

  getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<UserModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const userPromise = prisma.user.findUniqueOrThrow({ where: { id } });

    return Effect.promise(() => userPromise).pipe(Effect.map(UserModel.from));
  }

  getByEmail(email: string): Effect.Effect<UserModel, Error> {
    const userPromise = this.prismaClient.user.findUniqueOrThrow({
      where: { email },
    });

    return Effect.promise(() => userPromise).pipe(Effect.map(UserModel.from));
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<UserModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const usersPromise = prisma.user.findMany();

    return Effect.promise(() => usersPromise).pipe(
      Effect.map((users) => users.map(UserModel.from)),
    );
  }
}
