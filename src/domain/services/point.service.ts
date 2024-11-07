import { Inject, Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { PointRepository } from 'src/infrastructure/database/repositories';
import { WalletRepository } from 'src/infrastructure/database/repositories/wallet.repository';
import { CreatePointParam } from 'src/infrastructure/dto';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PointInfo } from '../dtos/info';
import { AppConflictException, ApplicationException } from '../exceptions';
import { WalletModel } from '../models';

@Injectable()
export class PointService {
  constructor(
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    private readonly prisma: PrismaService,
    private readonly pointRepository: PointRepository,
    private readonly walletRepository: WalletRepository,
  ) {}

  chargePoint(userId: number, amount: number) {
    const executeTransaction = (wallet: WalletModel) =>
      this.prisma.withTransaction((tx) =>
        pipe(
          this.walletRepository.update(
            wallet.id,
            { totalPoint: wallet.totalPoint + amount },
            wallet.version,
            tx,
          ),
          Effect.map(
            (wallet) =>
              new CreatePointParam({
                walletId: wallet.id,
                amount,
                transactionType: TransactionType.CHARGE,
              }),
          ),
          Effect.flatMap((params) => this.pointRepository.create(params, tx)),
          Effect.map(PointInfo.from),
        ),
      );

    return pipe(
      this.walletRepository.getByUserId(userId),
      Effect.flatMap(executeTransaction),
      Effect.catchIf(
        (error) => !(error instanceof ApplicationException),
        () =>
          Effect.fail(new AppConflictException(ErrorCodes.POINT_CHARGE_FAILED)),
      ),
    );
  }
}
