import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { ErrorCodes } from 'src/common/errors';
import { CompletePaymentCommand } from 'src/domain/dtos/commands/wallet/complete-payment.command';
import { WalletModel } from 'src/domain/models';
import { PointRepository } from 'src/infrastructure/database/repositories';
import { WalletRepository } from 'src/infrastructure/database/repositories/wallet.repository';
import { WalletInfo } from '../dtos/info';
import { AppConflictException, AppNotFoundException } from '../exceptions';

@Injectable()
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly pointRepository: PointRepository,
  ) {}

  async create(userId: number): Promise<WalletInfo> {
    const wallet = await this.walletRepository.create({ userId });

    return WalletInfo.from(wallet);
  }

  async getTotalPoint(userId: number): Promise<number> {
    try {
      return WalletInfo.from(await this.walletRepository.getByUserId(userId))
        .totalPoint;
    } catch {
      throw new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND);
    }
  }

  async completePayment(command: CompletePaymentCommand): Promise<WalletModel> {
    const wallet = await this.walletRepository
      .getByUserId(command.userId, command.transaction)
      .catch(() => {
        throw new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND);
      });

    // 잔액 확인
    wallet.payable(command.amount);

    // 결제 처리
    try {
      const updatedWallet = await this.walletRepository.update(
        wallet.id,
        {
          totalPoint: wallet.totalPoint - command.amount,
        },
        wallet.version,
        command.transaction,
      );

      await this.pointRepository.create(
        {
          walletId: wallet.id,
          amount: -command.amount,
          transactionType: TransactionType.PURCHASE,
        },
        command.transaction,
      );

      return updatedWallet;
    } catch (error) {
      throw new AppConflictException(ErrorCodes.PAYMENT_FAILED);
    }
  }
}
