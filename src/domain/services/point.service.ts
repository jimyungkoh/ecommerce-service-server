import { Inject, Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ErrorCodes } from 'src/common/errors';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { PointRepository } from 'src/infrastructure/database/repositories';
import { WalletRepository } from 'src/infrastructure/database/repositories/wallet.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PointInfo } from '../dtos/info';
import {
  AppConflictException,
  ApplicationException,
  AppNotFoundException,
} from '../exceptions';

@Injectable()
export class PointService {
  constructor(
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    private readonly prisma: PrismaService,
    private readonly pointRepository: PointRepository,
    private readonly walletRepository: WalletRepository,
  ) {}

  async chargePoint(userId: number, amount: number): Promise<PointInfo> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const wallet = await this.walletRepository
          .getByUserId(userId, tx)
          .catch(() => {
            throw new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND);
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
          wallet.id,
          {
            totalPoint: { increment: point.amount },
          },
          wallet.version,
          tx,
        );

        return PointInfo.from(point);
      });
    } catch (error) {
      if (error instanceof ApplicationException) {
        throw error;
      } else {
        throw new AppConflictException(ErrorCodes.POINT_CHARGE_FAILED);
      }
    }
  }
}