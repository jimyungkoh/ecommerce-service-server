import { Wallet } from '@prisma/client';
import { Effect } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import { AppConflictException } from 'src/domain/exceptions';

export type WalletModelProps = {
  id: number;
  userId: number;
  totalPoint: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export class WalletModel {
  readonly id: number;
  readonly userId: number;
  readonly totalPoint: number;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: WalletModelProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.totalPoint = props.totalPoint;
    this.version = props.version;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  payable(amount: number): Effect.Effect<boolean, AppConflictException> {
    if (this.totalPoint < amount) {
      return Effect.fail(
        new AppConflictException(ErrorCodes.WALLET_INSUFFICIENT_POINT),
      );
    }

    return Effect.succeed(true);
  }

  static from(wallet: Wallet): WalletModel {
    return new WalletModel({
      id: Number(wallet.id),
      userId: Number(wallet.userId),
      totalPoint: Number(wallet.totalPoint),
      version: Number(wallet.version),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    });
  }
}
