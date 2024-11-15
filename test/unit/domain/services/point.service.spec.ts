import { Test, TestingModule } from '@nestjs/testing';
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
import { logger } from 'test/integration/test-containers/setup-tests';

describe('PointService', () => {
  let pointService: PointService;
  let walletRepository: DeepMockProxy<WalletRepository>;
  let pointRepository: DeepMockProxy<PointRepository>;
  let prismaService: DeepMockProxy<PrismaService>;

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

    prismaService = module.get(PrismaService);
    pointService = module.get(PointService);
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
      walletRepository.updatePoint.mockImplementation(() =>
        Effect.succeed(wallet.charge(amount)),
      );
      pointRepository.create.mockImplementation(() => Effect.succeed(point));
      prismaService.transaction.mockImplementation((effect) =>
        effect(prismaService),
      );

      // when
      const result = await Effect.runPromise(
        pointService.chargePoint(userId, amount),
      ).catch((error) => {
        logger.error(JSON.stringify(error));
      });
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
      prismaService.transaction.mockImplementation((effect) =>
        effect(prismaService),
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
      walletRepository.updatePoint.mockImplementation(() =>
        Effect.fail(new AppConflictException(ErrorCodes.POINT_CHARGE_FAILED)),
      );
      prismaService.transaction.mockImplementation((effect) =>
        effect(prismaService),
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
