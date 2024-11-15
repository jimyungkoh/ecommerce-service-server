import { Injectable } from '@nestjs/common';
import { Effect, pipe } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import { CompletePaymentCommand } from 'src/domain/dtos/commands/wallet/complete-payment.command';
import { TransactionType, WalletModel } from 'src/domain/models';
import { PointRepository } from 'src/infrastructure/database/repositories';
import { WalletRepository } from 'src/infrastructure/database/repositories/wallet.repository';
import { WalletInfo } from '../dtos/info';
import {
  AppConflictException,
  ApplicationException,
  AppNotFoundException,
} from '../exceptions';

@Injectable()
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly pointRepository: PointRepository,
  ) {}

  create(userId: number): Effect.Effect<WalletInfo, Error> {
    return pipe(
      this.walletRepository.create({ userId }),
      Effect.map(WalletInfo.from),
    );
  }

  getTotalPoint(userId: number): Effect.Effect<number, AppNotFoundException> {
    return this.walletRepository.getByUserId(userId).pipe(
      Effect.map(WalletInfo.from),
      Effect.map((info) => info.totalPoint),
      Effect.catchAll(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND)),
      ),
    );
  }

  completePayment(command: CompletePaymentCommand) {
    const updateWallet = (wallet: WalletModel) =>
      this.walletRepository.update(
        wallet.id,
        { totalPoint: wallet.totalPoint - command.amount },
        wallet.version,
        command.transaction,
      );

    const createPoint = (wallet: WalletModel) =>
      this.pointRepository.create(
        {
          walletId: wallet.id,
          amount: -command.amount,
          transactionType: TransactionType.PURCHASE,
        },
        command.transaction,
      );

    return pipe(
      this.walletRepository.getByUserId(command.userId, command.transaction),
      Effect.tap((wallet) => wallet.payable(command.amount)),
      Effect.tap(createPoint),
      Effect.flatMap(updateWallet),
      Effect.map(WalletInfo.from),
      Effect.catchIf(
        (e) => !(e instanceof ApplicationException),
        () => Effect.fail(new AppConflictException(ErrorCodes.PAYMENT_FAILED)),
      ),
    );
  }
}
