import { Injectable } from '@nestjs/common';
import { Prisma, Wallet } from '@prisma/client';
import { WalletDomain } from 'src/infrastructure/dtos/domains';
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

    return new WalletDomain({
      id: wallet.id,
      userId: wallet.userId,
      totalPoint: wallet.totalPoint,
      version: wallet.version,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    });
  }

  async update(
    id: number,
    data: Prisma.WalletUpdateInput,
    version?: bigint,
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletDomain> {
    const prisma = transaction ?? this.prismaClient;
    try {
      // 버전 체크와 업데이트를 하나의 쿼리로 처리
      const updatedWallet = await prisma.wallet.update({
        where: {
          id,
          // 버전이 제공된 경우에만 버전 체크 조건 추가
          ...(version !== undefined && { version }),
        },
        data: {
          ...data,
          // 현재 버전에 1을 더함
          version: {
            increment: 1, // Prisma의 increment 연산자 사용
          },
        },
      });

      return new WalletDomain({
        id: updatedWallet.id,
        userId: updatedWallet.userId,
        totalPoint: updatedWallet.totalPoint,
        version: updatedWallet.version,
        createdAt: updatedWallet.createdAt,
        updatedAt: updatedWallet.updatedAt,
      });
    } catch (error) {
      throw error;
    }
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

    return new WalletDomain({
      id: wallet.id,
      userId: wallet.userId,
      totalPoint: wallet.totalPoint,
      version: wallet.version,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    });
  }

  async getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletDomain> {
    const prisma = transaction ?? this.prismaClient;
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id } });

    return new WalletDomain({
      id: wallet.id,
      userId: wallet.userId,
      totalPoint: wallet.totalPoint,
      version: wallet.version,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    });
  }

  async getByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletDomain> {
    const prisma = transaction ?? this.prismaClient;
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });

    return new WalletDomain({
      id: wallet.id,
      userId: wallet.userId,
      totalPoint: wallet.totalPoint,
      version: wallet.version,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    });
  }

  async findAll(
    transaction?: Prisma.TransactionClient,
  ): Promise<WalletDomain[]> {
    const prisma = transaction ?? this.prismaClient;
    const wallets = await prisma.wallet.findMany();

    return wallets.map(
      (wallet) =>
        new WalletDomain({
          id: wallet.id,
          userId: wallet.userId,
          totalPoint: wallet.totalPoint,
          version: wallet.version,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
        }),
    );
  }
}
