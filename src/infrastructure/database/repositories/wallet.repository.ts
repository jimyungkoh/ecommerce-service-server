import { Injectable } from '@nestjs/common';
import { Prisma, Wallet } from '@prisma/client';
import { WalletDomain } from 'src/domain';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class WalletRepository implements BaseRepository<Wallet, WalletDomain> {
  constructor(private readonly prismaClient: PrismaService) {}

  async create(
    data: Prisma.WalletUncheckedCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletDomain> {
    const prisma = transaction ?? this.prismaClient;
    const wallet = await prisma.wallet.create({ data });

    return new WalletDomain(
      wallet.id,
      wallet.userId,
      wallet.totalPoint,
      wallet.version,
      wallet.createdAt,
      wallet.updatedAt,
    );
  }

  async update(
    id: number,
    data: Prisma.WalletUpdateInput,
    version?: bigint,
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletDomain> {
    const prisma = transaction ?? this.prismaClient;

    const wallet = await prisma.wallet.findUniqueOrThrow({
      where: { id, version },
    });

    return new WalletDomain(
      wallet.id,
      wallet.userId,
      wallet.totalPoint,
      wallet.version,
      wallet.createdAt,
      wallet.updatedAt,
    );
  }

  async delete(
    id: number,
    version?: bigint,
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = transaction ?? this.prismaClient;
    await prisma.wallet.delete({ where: { id } });
  }

  async findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletDomain | null> {
    const prisma = transaction ?? this.prismaClient;
    const wallet = await prisma.wallet.findUnique({ where: { id } });

    if (!wallet) return null;

    return new WalletDomain(
      wallet.id,
      wallet.userId,
      wallet.totalPoint,
      wallet.version,
      wallet.createdAt,
      wallet.updatedAt,
    );
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletDomain> {
    const prisma = transaction ?? this.prismaClient;
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id } });

    return new WalletDomain(
      wallet.id,
      wallet.userId,
      wallet.totalPoint,
      wallet.version,
      wallet.createdAt,
      wallet.updatedAt,
    );
  }

  async getByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletDomain> {
    const prisma = transaction ?? this.prismaClient;
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });

    return new WalletDomain(
      wallet.id,
      wallet.userId,
      wallet.totalPoint,
      wallet.version,
      wallet.createdAt,
      wallet.updatedAt,
    );
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const wallets = await prisma.wallet.findMany();

    return wallets.map(
      (wallet) =>
        new WalletDomain(
          wallet.id,
          wallet.userId,
          wallet.totalPoint,
          wallet.version,
          wallet.createdAt,
          wallet.updatedAt,
        ),
    );
  }
}
