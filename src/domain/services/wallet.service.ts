import { Injectable } from '@nestjs/common';
import { Effect, pipe } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import { CompletePaymentCommand } from 'src/domain/dtos/commands/wallet/complete-payment.command';
import { TransactionType } from 'src/domain/models';
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
    return this.walletRepository
      .create({ userId })
      .pipe(Effect.map(WalletInfo.from));
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
    return pipe(
      this.walletRepository.getByUserId(command.userId, command.transaction),
      Effect.flatMap((wallet) => {
        return pipe(
          wallet.payable(command.amount),
          Effect.map(() => wallet),
        );
      }),
      Effect.flatMap((wallet) => {
        return Effect.all([
          this.walletRepository.update(
            wallet.id,
            { totalPoint: wallet.totalPoint - command.amount },
            wallet.version,
            command.transaction,
          ),
          this.pointRepository.create(
            {
              walletId: wallet.id,
              amount: -command.amount,
              transactionType: TransactionType.PURCHASE,
            },
            command.transaction,
          ),
        ]);
      }),
      Effect.map(([updatedWallet]) => WalletInfo.from(updatedWallet)),
      Effect.catchIf(
        (e) => !(e instanceof ApplicationException),
        () => Effect.fail(new AppConflictException(ErrorCodes.PAYMENT_FAILED)),
      ),
    );
  }
  // try {
  //   const updatedWallet = await this.walletRepository.update(
  //     wallet.id,
  //     {
  //       totalPoint: wallet.totalPoint - command.amount,
  //     },
  //     wallet.version,
  //     command.transaction,
  //   );

  //   await this.pointRepository.create(
  //     {
  //       walletId: wallet.id,
  //       amount: -command.amount,
  //       transactionType: TransactionType.PURCHASE,
  //     },
  //     command.transaction,
  //   );

  //   return updatedWallet;
  // } catch (error) {
  //   throw new AppConflictException(ErrorCodes.PAYMENT_FAILED);
  // }
}
