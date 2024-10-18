import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import {
  PaymentFailedException,
  WalletInsufficientPointException,
  WalletNotFoundException,
} from 'src/application/exceptions';
import { WalletService } from 'src/application/services/wallet.service';
import { PointDomain, TransactionType, WalletDomain } from 'src/domain';
import { PointRepository } from 'src/infrastructure/database/repositories';
import { WalletRepository } from 'src/infrastructure/database/repositories/wallet.repository';

describe('WalletService', () => {
  let walletService: WalletService;
  let pointRepository: DeepMockProxy<PointRepository>;
  let walletRepository: DeepMockProxy<WalletRepository>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: WalletRepository,
          useFactory: () => mockDeep<WalletRepository>(),
        },
        {
          provide: PointRepository,
          useFactory: () => mockDeep<PointRepository>(),
        },
      ],
    }).compile();

    walletService = module.get<WalletService>(WalletService);
    walletRepository = module.get(WalletRepository);
    pointRepository = module.get(PointRepository);
  });

  describe('getTotalPoint', () => {
    it('유효한 사용자의 총 포인트를 반환해야 합니다', async () => {
      // given
      const userId = 1;
      const totalPoint = new Decimal(100);
      const wallet = new WalletDomain(
        1,
        userId,
        totalPoint,
        BigInt(1),
        new Date(),
        new Date(),
      );
      walletRepository.getByUserId.mockResolvedValue(wallet);

      // when
      const result = await walletService.getTotalPoint(userId);

      // then
      expect(result).toBe(totalPoint);
    });

    it('지갑을 찾을 수 없으면 WalletNotFoundException을 던져야 합니다', async () => {
      // given
      const userId = 1;
      walletRepository.getByUserId.mockRejectedValue(new Error());

      // when
      const result = walletService.getTotalPoint(userId);

      // then
      await expect(result).rejects.toThrow(WalletNotFoundException);
    });
  });

  describe('completePayment', () => {
    it('결제가 성공하면 업데이트된 지갑을 반환해야 합니다', async () => {
      // given
      const userId = 1;
      const amount = new Decimal(50);
      const transaction = {} as Prisma.TransactionClient;
      const wallet = new WalletDomain(
        1,
        userId,
        new Decimal(100),
        BigInt(1),
        new Date(),
        new Date(),
      );
      const updatedWallet = new WalletDomain(
        1,
        userId,
        new Decimal(50),
        BigInt(1),
        new Date(),
        new Date(),
      );

      walletRepository.getByUserId.mockResolvedValue(wallet);
      walletRepository.update.mockResolvedValue(updatedWallet);
      pointRepository.create.mockResolvedValue(
        new PointDomain(
          BigInt(1),
          wallet.id,
          amount,
          TransactionType.PURCHASE,
          new Date(),
          new Date(),
          null,
        ),
      );

      // when
      const result = await walletService.completePayment(
        userId,
        amount,
        transaction,
      );

      // then
      expect(result).toBe(updatedWallet);
    });

    it('잔액이 부족하면 WalletInsufficientPointException을 던져야 합니다', async () => {
      // given
      const userId = 1;
      const amount = new Decimal(150);
      const transaction = {} as Prisma.TransactionClient;
      const wallet = new WalletDomain(
        1,
        userId,
        new Decimal(100),
        BigInt(1),
        new Date(),
        new Date(),
      );

      walletRepository.getByUserId.mockResolvedValue(wallet);

      // when
      const result = walletService.completePayment(userId, amount, transaction);

      // then
      await expect(result).rejects.toThrow(WalletInsufficientPointException);
    });

    it('결제 처리 중 오류가 발생하면 PaymentFailedException을 던져야 합니다', async () => {
      // given
      const userId = 1;
      const amount = new Decimal(50);
      const transaction = {} as Prisma.TransactionClient;
      const wallet = new WalletDomain(
        1,
        userId,
        new Decimal(100),
        BigInt(1),
        new Date(),
        new Date(),
      );

      walletRepository.getByUserId.mockResolvedValue(wallet);
      walletRepository.update.mockRejectedValue(new Error());
      pointRepository.create.mockResolvedValue(
        new PointDomain(
          BigInt(1),
          wallet.id,
          amount,
          TransactionType.PURCHASE,
          new Date(),
          new Date(),
          null,
        ),
      );

      // when
      const result = walletService.completePayment(userId, amount, transaction);

      // then
      await expect(result).rejects.toThrow(PaymentFailedException);
    });

    it('지갑을 찾을 수 없으면 WalletNotFoundException을 던져야 합니다', async () => {
      // given
      const userId = 1;
      const amount = new Decimal(50);
      const transaction = {} as Prisma.TransactionClient;

      walletRepository.getByUserId.mockRejectedValue(new Error());

      // when
      const result = walletService.completePayment(userId, amount, transaction);

      // then
      await expect(result).rejects.toThrow(WalletNotFoundException);
    });
  });
});
