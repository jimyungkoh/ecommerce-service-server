import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { Effect } from 'effect';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ErrorCodes } from 'src/common/errors';
import { LoggerModule } from 'src/common/logger';
import { PointInfo } from 'src/domain/dtos/info';
import {
  AppConflictException,
  AppNotFoundException,
} from 'src/domain/exceptions';
import { PointModel, TransactionType, WalletModel } from 'src/domain/models';
import { PointService } from 'src/domain/services';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { PointRepository } from 'src/infrastructure/database/repositories';
import { WalletRepository } from 'src/infrastructure/database/repositories/wallet.repository';

describe('PointService', () => {
  let pointService: PointService;
  let prismaService: DeepMockProxy<PrismaService>;
  let walletRepository: DeepMockProxy<WalletRepository>;
  let pointRepository: DeepMockProxy<PointRepository>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        PointService,
        {
          provide: PrismaService,
          useFactory: () => mockDeep<PrismaService>(),
        },
        {
          provide: PointRepository,
          useFactory: () => mockDeep<PointRepository>(),
        },
        {
          provide: WalletRepository,
          useFactory: () => mockDeep<WalletRepository>(),
        },
      ],
    }).compile();
    pointService = module.get(PointService);
    prismaService = module.get(PrismaService);
    walletRepository = module.get(WalletRepository);
    pointRepository = module.get(PointRepository);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('chargePoint', () => {
    it('포인트 충전이 성공하면 업데이트된 포인트를 반환해야 합니다', async () => {
      // given
      const userId = 1;
      const amount = 100;
      const wallet = new WalletModel({
        id: 1,
        userId,
        totalPoint: 0,
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const point = new PointModel({
        id: 1,
        walletId: wallet.id,
        amount,
        transactionType: TransactionType.CHARGE,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiredAt: null,
      });

      walletRepository.getByUserId.mockImplementation(() =>
        Effect.succeed(wallet),
      );
      walletRepository.update.mockImplementation(() => Effect.succeed(wallet));
      pointRepository.create.mockImplementation(() => Effect.succeed(point));
      prismaService.withTransaction.mockImplementation((fn) =>
        fn({} as Prisma.TransactionClient),
      );

      // when
      const result = await Effect.runPromise(
        pointService.chargePoint(userId, amount),
      );
      const expected = PointInfo.from(point);

      // then
      expect(result).toEqual(expected);
    });

    it('지갑을 찾을 수 없으면 WalletNotFoundException을 던져야 합니다', async () => {
      // given
      const userId = 1;
      const amount = 100;

      walletRepository.getByUserId.mockImplementation(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND)),
      );

      // when & then
      await expect(
        Effect.runPromise(pointService.chargePoint(userId, amount)),
      ).rejects.toThrow(new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND));
    });

    it('트랜잭션 오류가 발생하면 PointChargeFailedException을 던져야 합니다', async () => {
      // given
      const userId = 1;
      const amount = 100;
      const wallet = new WalletModel({
        id: 1,
        userId,
        totalPoint: 0,
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      walletRepository.getByUserId.mockImplementation(() =>
        Effect.succeed(wallet),
      );
      walletRepository.update.mockImplementation(() =>
        Effect.fail(new Error('Transaction failed')),
      );
      prismaService.withTransaction.mockImplementation((fn) =>
        fn({} as Prisma.TransactionClient),
      );

      // when & then
      await expect(
        Effect.runPromise(pointService.chargePoint(userId, amount)),
      ).rejects.toThrow(
        new AppConflictException(ErrorCodes.POINT_CHARGE_FAILED),
      );
    });
  });
});
