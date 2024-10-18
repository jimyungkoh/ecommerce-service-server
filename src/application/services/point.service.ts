import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PointDomain } from 'src/domain';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { PointRepository } from 'src/infrastructure/database/repositories';
import { WalletRepository } from 'src/infrastructure/database/repositories/wallet.repository';
import { WalletNotFoundException } from '../exceptions';
import { PointChargeFailedException } from '../exceptions/point-charge-failed.exception';

@Injectable()
export class PointService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pointRepository: PointRepository,
    private readonly walletRepository: WalletRepository,
  ) {}

  async chargePoint(userId: number, amount: number): Promise<PointDomain> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const wallet = await this.walletRepository
          .getByUserId(userId, tx)
          .catch(() => {
            throw new WalletNotFoundException();
          });

        const point = await this.pointRepository.create(
          {
            walletId: wallet.id,
            amount: new Decimal(amount),
            transactionType: TransactionType.CHARGE,
          },
          tx,
        );

        await this.walletRepository.update(
          userId,
          {
            totalPoint: { increment: point.amount },
            version: wallet.version + BigInt(1),
          },
          wallet.version,
          tx,
        );

        return point;
      });
    } catch (error) {
      if (error instanceof WalletNotFoundException) {
        throw error;
      }

      throw new PointChargeFailedException();
    }
  }
}
