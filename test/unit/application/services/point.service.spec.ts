import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, TransactionType } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { WalletNotFoundException } from 'src/application/exceptions';
import { PointChargeFailedException } from 'src/application/exceptions/point-charge-failed.exception';
import { PointService } from 'src/application/services/point.service';
import { PointDomain, WalletDomain } from 'src/domain';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { PointRepository } from 'src/infrastructure/database/repositories';
import { WalletRepository } from 'src/infrastructure/database/repositories/wallet.repository';

describe('PointService', () => {
  let pointService: PointService;
  let prismaService: DeepMockProxy<PrismaService>;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('chargePoint', () => {
    it('포인트 충전 성공', async () => {
      // given
      const userId = 1;
      const amount = 100;
      const wallet = new WalletDomain(
        1,
        userId,
        new Prisma.Decimal(0),
        BigInt(2),
        new Date(),
        new Date(),
      );
      const point = new PointDomain(
        BigInt(1),
        wallet.id,
        new Prisma.Decimal(amount),
        TransactionType.CHARGE,
        new Date(),
        new Date(),
        null,
      );
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

    it('포인트 충전 실패 - 지갑을 찾을 수 없음', async () => {
      // given
      const userId = 1;
      const amount = 100;

      prismaService.$transaction.mockRejectedValue(
        new WalletNotFoundException(),
      );

      // when & then
      await expect(pointService.chargePoint(userId, amount)).rejects.toThrow(
        new WalletNotFoundException(),
      );
    });

    it('포인트 충전 실패 - 트랜잭션 오류', async () => {
      // given
      const userId = 1;
      const amount = 100;

      prismaService.$transaction.mockRejectedValue(new Error());

      // when & then
      await expect(pointService.chargePoint(userId, amount)).rejects.toThrow(
        PointChargeFailedException,
      );
    });
  });
});
