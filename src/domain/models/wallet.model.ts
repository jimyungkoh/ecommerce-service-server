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
  constructor(private readonly props: WalletModelProps) {}

  get id(): number {
    return this.props.id;
  }

  get userId(): number {
    return this.props.userId;
  }

  get totalPoint(): number {
    return this.props.totalPoint;
  }

  get version(): number {
    return this.props.version;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
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
