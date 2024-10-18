import { Injectable } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';
import { WalletDomain } from 'src/domain';
import { PointRepository } from 'src/infrastructure/database/repositories';
import { WalletRepository } from 'src/infrastructure/database/repositories/wallet.repository';
import { WalletNotFoundException } from '../exceptions';
import { PaymentFailedException } from '../exceptions/payment-failed.exception';
import { WalletInsufficientPointException } from '../exceptions/wallet-insufficient-point.exception';

@Injectable()
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly pointRepository: PointRepository,
  ) {}

  async getTotalPoint(userId: number): Promise<Decimal> {
    try {
      return (await this.walletRepository.getByUserId(userId)).totalPoint;
    } catch {
      throw new WalletNotFoundException();
    }
  }

  async completePayment(
    userId: number,
    amount: Decimal,
    transaction: Prisma.TransactionClient,
  ): Promise<WalletDomain> {
    const wallet = await this.walletRepository
      .getByUserId(userId, transaction)
      .catch(() => {
        throw new WalletNotFoundException();
      });

    // 잔액 확인
    if (!wallet.payable(amount)) throw new WalletInsufficientPointException();

    // 결제 처리
    try {
      const [updatedWallet, _] = await Promise.all([
        this.walletRepository.update(
          wallet.id,
          {
            totalPoint: wallet.totalPoint.minus(amount),
          },
          wallet.version,
        ),
        this.pointRepository.create({
          walletId: wallet.id,
          amount: amount.negated(),
          transactionType: TransactionType.PURCHASE,
        }),
      ]);
      return updatedWallet;
    } catch (error) {
      throw new PaymentFailedException();
    }
  }
}
