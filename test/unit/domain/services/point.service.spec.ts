import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ErrorCodes } from 'src/common/errors';
import { LoggerModule } from 'src/common/logger';
import {
  AppConflictException,
  AppNotFoundException,
} from 'src/domain/exceptions';
import { PointService } from 'src/domain/services';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { PointRepository } from 'src/infrastructure/database/repositories';
import { WalletRepository } from 'src/infrastructure/database/repositories/wallet.repository';
import { pointServiceFixture } from './helpers/point.service.fixture';

describe('PointService', () => {
  let pointService: PointService;
  let prismaService: DeepMockProxy<PrismaService>;
  let walletRepository: DeepMockProxy<WalletRepository>;
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('chargePoint', () => {
    it('포인트 충전이 성공하면 업데이트된 포인트를 반환해야 합니다', async () => {
      // given
      const { userId, amount, point, wallet } = pointServiceFixture();
      walletRepository.getByUserId.mockResolvedValue(wallet);
      prismaService.$transaction.mockResolvedValue(point);

      // when
      const result = await pointService.chargePoint(userId, amount);
      const expected = JSON.stringify(point, (key, value) =>
        key === 'id' ? value.toString() : value,
      );

      // then
      expect(
        JSON.stringify(result, (key, value) =>
          key === 'id' ? value.toString() : value,
        ),
      ).toEqual(expected);
    });

    it('지갑을 찾을 수 없으면 WalletNotFoundException을 던져야 합니다', async () => {
      // given
      const { userId, amount } = pointServiceFixture();

      walletRepository.getByUserId.mockRejectedValue(
        new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND),
      );

      // when & then
      await expect(pointService.chargePoint(userId, amount)).rejects.toThrow(
        new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND),
      );
    });

    it('트랜잭션 오류가 발생하면 PointChargeFailedException을 던져야 합니다', async () => {
      // given
      const { userId, amount, wallet } = pointServiceFixture();
      walletRepository.getByUserId.mockResolvedValue(wallet);
      prismaService.$transaction.mockRejectedValue(new Error());

      // when & then
      await expect(pointService.chargePoint(userId, amount)).rejects.toThrow(
        new AppConflictException(ErrorCodes.POINT_CHARGE_FAILED),
      );
    });

    it('음수 금액을 충전하려고 하면 오류를 던져야 합니다', async () => {
      // given
      const { userId, wallet } = pointServiceFixture();
      walletRepository.getByUserId.mockResolvedValue(wallet);
      const amount = -100;

      // when & then
      await expect(pointService.chargePoint(userId, amount)).rejects.toThrow(
        new AppConflictException(ErrorCodes.POINT_CHARGE_FAILED),
      );
    });

    it('금액이 0이면 오류를 던져야 합니다', async () => {
      // given
      const { userId, wallet } = pointServiceFixture();
      walletRepository.getByUserId.mockResolvedValue(wallet);
      const amount = 0;

      // when & then
      await expect(pointService.chargePoint(userId, amount)).rejects.toThrow(
        new AppConflictException(ErrorCodes.POINT_CHARGE_FAILED),
      );
    });
  });
});
