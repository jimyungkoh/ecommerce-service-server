import { Prisma, TransactionType } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { PointRepository } from 'src/infrastructure/database/repositories';
import { WalletRepository } from 'src/infrastructure/database/repositories/wallet.repository';
import { CreatePointParam } from 'src/infrastructure/dto';
import { UpdateWalletPointParam } from 'src/infrastructure/dto/param/wallet/update-wallet-point.param';
import { Domain } from '../../common/decorators';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PointInfo } from '../dtos';
import { WalletModel } from '../models';

@Domain()
export class PointService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pointRepository: PointRepository,
    private readonly walletRepository: WalletRepository,
  ) {}

  chargePoint(userId: number, amount: number) {
    const createPointParam = (wallet: WalletModel) =>
      new CreatePointParam({
        walletId: wallet.id,
        amount,
        transactionType: TransactionType.CHARGE,
      });

    const chargeWallet = (wallet: WalletModel) => wallet.charge(amount);

    const updateWallet = (
      wallet: WalletModel,
      transaction: Prisma.TransactionClient,
    ) =>
      this.walletRepository.updatePoint(
        UpdateWalletPointParam.from(wallet),
        transaction,
      );

    const createPoint = (
      pointData: CreatePointParam,
      transaction: Prisma.TransactionClient,
    ) => this.pointRepository.create(pointData, transaction);

    return this.prisma.transaction((transaction) =>
      pipe(
        this.walletRepository.getByUserId(userId, transaction),
        Effect.map(chargeWallet),
        Effect.flatMap((wallet) => updateWallet(wallet, transaction)),
        Effect.map((wallet) => createPointParam(wallet)),
        Effect.flatMap((pointData) => createPoint(pointData, transaction)),
        Effect.map(PointInfo.from),
      ),
    );
  }
}
