import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { UserModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class UserRepository implements BaseRepository<User, UserModel> {
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: Prisma.UserCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<UserModel> {
    const prisma = transaction ?? this.prismaClient;
    const user = await prisma.user.create({ data });

    return UserModel.from(user);
  }

  async update(
    id: number,
    data: User,
    transaction?: Prisma.TransactionClient,
  ): Promise<UserModel> {
    const prisma = transaction ?? this.prismaClient;
    const user = await prisma.user.update({ where: { id }, data });

    return UserModel.from(user);
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
  ): Promise<UserModel | null> {
    const prisma = transaction ?? this.prismaClient;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) return null;

    return UserModel.from(user);
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<UserModel> {
    const prisma = transaction ?? this.prismaClient;
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });

    return UserModel.from(user);
  }

  async getByEmail(email: string) {
    const user = await this.prismaClient.user.findUniqueOrThrow({
      where: { email },
    });

    return UserModel.from(user);
  }

  async findAll(transaction?: Prisma.TransactionClient): Promise<UserModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const users = await prisma.user.findMany();

    return users.map(UserModel.from);
  }
}
