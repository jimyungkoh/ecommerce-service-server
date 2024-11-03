import { Inject, Injectable } from '@nestjs/common';
import { Prisma, Wallet } from '@prisma/client';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { WalletModel } from 'src/domain/models';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class WalletRepository implements BaseRepository<Wallet, WalletModel> {
  constructor(
    private readonly prismaClient: PrismaService,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  async create(
    data: Prisma.WalletUncheckedCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletModel> {
    const prisma = transaction ?? this.prismaClient;
    const wallet = await prisma.wallet.create({ data });

    return WalletModel.from(wallet);
  }

  async update(
    id: number,
    data: Prisma.WalletUpdateInput,
    version?: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletModel> {
    if (typeof version !== 'number') {
      throw new Error('버전값은 필수입니다');
    }

    const prisma = transaction ?? this.prismaClient;
    try {
      const updatedWallet = await prisma.wallet.update({
        where: {
          id,
          version,
        },
        data: {
          ...data,
          version: {
            increment: 1,
          },
        },
      });

      return WalletModel.from(updatedWallet);
    } catch (error) {
      throw error;
    }
  }

  async delete(
    id: number,
    version?: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = transaction ?? this.prismaClient;
    await prisma.wallet.delete({ where: { id } });
  }

  async findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletModel | null> {
    const prisma = transaction ?? this.prismaClient;
    const wallet = await prisma.wallet.findUnique({ where: { id } });

    if (!wallet) return null;

    return WalletModel.from(wallet);
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletModel> {
    const prisma = transaction ?? this.prismaClient;
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id } });

    return WalletModel.from(wallet);
  }

  async getByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletModel> {
    const prisma = transaction ?? this.prismaClient;
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });

    return WalletModel.from(wallet);
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletModel[]> {
    const prisma = transaction ?? this.prismaClient;
    const wallets = await prisma.wallet.findMany();

    return wallets.map(WalletModel.from);
  }
}
