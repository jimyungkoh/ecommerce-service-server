import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { UserDomain } from 'src/domain';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class UserRepository implements BaseRepository<User, UserDomain> {
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: Prisma.UserCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<UserDomain> {
    const prisma = transaction ?? this.prismaClient;
    const user = await prisma.user.create({ data });

    return new UserDomain(user.id, user.email, user.createdAt, user.updatedAt);
  }

  async update(
    id: number,
    data: User,
    transaction?: Prisma.TransactionClient,
  ): Promise<UserDomain> {
    const prisma = transaction ?? this.prismaClient;
    const user = await prisma.user.update({ where: { id }, data });

    return new UserDomain(user.id, user.email, user.createdAt, user.updatedAt);
  }

  async delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = transaction ?? this.prismaClient;
    await prisma.user.delete({ where: { id } });
  }

  async findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<UserDomain | null> {
    const prisma = transaction ?? this.prismaClient;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) return null;

    return new UserDomain(user.id, user.email, user.createdAt, user.updatedAt);
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<UserDomain> {
    const prisma = transaction ?? this.prismaClient;
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });

    return new UserDomain(user.id, user.email, user.createdAt, user.updatedAt);
  }

  async findAll(transaction?: Prisma.TransactionClient): Promise<UserDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const users = await prisma.user.findMany();

    return users.map(
      (user) =>
        new UserDomain(user.id, user.email, user.createdAt, user.updatedAt),
    );
  }
}
