import { Inject, Injectable } from '@nestjs/common';
import { Prisma, Wallet } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { AppNotFoundException } from 'src/domain/exceptions';
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

  create(
    data: Prisma.WalletUncheckedCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<WalletModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const walletPromise = Effect.tryPromise(() =>
      prisma.wallet.create({ data }),
    );

    return pipe(walletPromise, Effect.map(WalletModel.from));
  }

  update(
    id: number,
    data: Prisma.WalletUpdateInput,
    version?: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<WalletModel, Error> {
    const prisma = transaction ?? this.prismaClient;

    const updatedWalletPromise = Effect.tryPromise(() =>
      prisma.wallet.update({
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
      }),
    );

    return pipe(
      updatedWalletPromise,
      Effect.map(WalletModel.from),
      Effect.catchAll(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND)),
      ),
    );
    // return Effect.gen(function* () {
    //   if (typeof version !== 'number') {
    //     return yield* Effect.fail(new Error('버전값은 필수입니다'));
    //   }
    //   const updatedWallet = yield* Effect.promise(() => updatedWalletPromise);
    //   return WalletModel.from(updatedWallet);
    // });
  }

  delete(
    id: number,
    version?: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prismaClient;
    const deletePromise = Effect.tryPromise(() =>
      prisma.wallet.delete({ where: { id } }),
    );

    return pipe(
      deletePromise,
      Effect.map(() => void 0),
    );
  }

  findById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<WalletModel | null, Error> {
    const prisma = transaction ?? this.prismaClient;
    const walletPromise = Effect.tryPromise(() =>
      prisma.wallet.findUnique({ where: { id } }),
    );

    return pipe(
      walletPromise,
      Effect.map((wallet) => (wallet ? WalletModel.from(wallet) : null)),
    );
  }

  getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<WalletModel, Error> {
    const prisma = transaction ?? this.prismaClient;
    const walletPromise = Effect.tryPromise(() =>
      prisma.wallet.findUniqueOrThrow({ where: { id } }),
    );

    return pipe(
      walletPromise,
      Effect.map(WalletModel.from),
      Effect.catchAll(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND)),
      ),
    );
  }

  getByUserId(
    userId: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<WalletModel, AppNotFoundException> {
    const prisma = transaction ?? this.prismaClient;
    const walletPromise = Effect.tryPromise(() =>
      prisma.wallet.findUniqueOrThrow({ where: { userId } }),
    );

    return pipe(
      walletPromise,
      Effect.map(WalletModel.from),
      Effect.catchAll(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND)),
      ),
    );
  }

  findAll(
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<WalletModel[], Error> {
    const prisma = transaction ?? this.prismaClient;
    const walletsPromise = Effect.tryPromise(() => prisma.wallet.findMany());

    return pipe(
      walletsPromise,
      Effect.map((wallets) => wallets.map(WalletModel.from)),
    );
  }
}
