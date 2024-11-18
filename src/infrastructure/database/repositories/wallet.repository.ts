import { Inject, Injectable } from '@nestjs/common';
import { Prisma, Wallet } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import {
  AppConflictException,
  AppNotFoundException,
} from 'src/domain/exceptions';
import { WalletModel } from 'src/domain/models';
import { UpdateWalletPointParam } from 'src/infrastructure/dto/param/wallet/update-wallet-point.param';
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
  ) {
    const prisma = transaction ?? this.prismaClient;

    const updatedWalletPromise = Effect.tryPromise(() =>
      prisma.wallet.update({
        where: { id, version },
        data: {
          ...data,
          version: {
            increment: 1n,
          },
        },
      }),
    );

    return pipe(
      updatedWalletPromise,
      Effect.map(WalletModel.from),
      Effect.catchAll(() => {
        return Effect.fail(
          new AppConflictException(ErrorCodes.POINT_CHARGE_FAILED),
        );
      }),
    );
  }

  updatePoint(
    params: UpdateWalletPointParam,
    transaction: Prisma.TransactionClient,
  ) {
    const updateWallet = Effect.tryPromise(() =>
      transaction.wallet.update({
        where: {
          id: params.id,
          version: params.version,
        },
        data: {
          totalPoint: params.amount,
          version: { increment: 1n },
        },
      }),
    );

    const validateVersion = (wallet: Wallet) =>
      wallet.version === BigInt(params.version) + 1n
        ? Effect.succeed(wallet)
        : Effect.fail(new AppConflictException(ErrorCodes.POINT_CHARGE_FAILED));

    const handleError = () =>
      Effect.fail(new AppConflictException(ErrorCodes.POINT_CHARGE_FAILED));

    return pipe(
      updateWallet,
      Effect.flatMap(validateVersion),
      Effect.map(WalletModel.from),
      Effect.catchAll(handleError),
    );
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

  findOneBy(
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
      prisma.wallet.findUniqueOrThrow({
        where: { userId },
      }),
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
