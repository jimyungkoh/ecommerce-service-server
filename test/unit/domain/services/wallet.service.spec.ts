import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ErrorCodes } from 'src/common/errors';
import { CompletePaymentCommand } from 'src/domain/dtos';
import { WalletInfo } from 'src/domain/dtos/info';
import {
  AppConflictException,
  AppNotFoundException,
} from 'src/domain/exceptions';
import { WalletService } from 'src/domain/services';
import { PointRepository } from 'src/infrastructure/database/repositories';
import { WalletRepository } from 'src/infrastructure/database/repositories/wallet.repository';
import { walletServiceFixture } from './helpers/wallet.service.fixture';

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

    walletService = module.get(WalletService);
    walletRepository = module.get(WalletRepository);
    pointRepository = module.get(PointRepository);
  });

  describe('getTotalPoint', () => {
    it('유효한 사용자의 총 포인트를 반환해야 합니다', async () => {
      // given
      const { wallet } = walletServiceFixture();
      walletRepository.getByUserId.mockResolvedValue(wallet);

      // when
      const result = await walletService.getTotalPoint(wallet.userId);

      // then
      expect(result).toBe(wallet.totalPoint);
    });

    it('지갑을 찾을 수 없으면 WalletNotFoundException을 던져야 합니다', async () => {
      // given
      const { wallet } = walletServiceFixture();
      walletRepository.getByUserId.mockRejectedValue(new Error());

      // when
      const result = walletService.getTotalPoint(wallet.userId);

      // then
      await expect(result).rejects.toThrow(
        new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND),
      );
    });
  });

  describe('completePayment', () => {
    it('결제가 성공하면 업데이트된 지갑을 반환해야 합니다', async () => {
      // given
      const { wallet, point, updatedWallet } = walletServiceFixture();
      const transaction = {} as Prisma.TransactionClient;

      walletRepository.getByUserId.mockResolvedValue(wallet);
      walletRepository.update.mockResolvedValue(updatedWallet);
      pointRepository.create.mockResolvedValue(point);

      // when
      const result = await walletService.completePayment(
        new CompletePaymentCommand({
          userId: wallet.userId,
          amount: point.amount,
          transaction,
        }),
      );

      // then
      expect(result).toBe(updatedWallet);
    });

    it('잔액이 부족하면 WalletInsufficientPointException을 던져야 합니다', async () => {
      // given
      const { wallet, transaction, largeAmount } = walletServiceFixture();

      walletRepository.getByUserId.mockResolvedValue(wallet);

      // when
      const result = walletService.completePayment(
        new CompletePaymentCommand({
          userId: wallet.userId,
          amount: largeAmount,
          transaction,
        }),
      );

      // then
      await expect(result).rejects.toThrow(
        new AppConflictException(ErrorCodes.WALLET_INSUFFICIENT_POINT),
      );
    });

    it('결제 처리 중 오류가 발생하면 PaymentFailedException을 던져야 합니다', async () => {
      // given
      const { wallet, point, transaction } = walletServiceFixture();

      walletRepository.getByUserId.mockResolvedValue(wallet);
      walletRepository.update.mockRejectedValue(new Error());
      pointRepository.create.mockResolvedValue(point);

      // when
      const result = walletService.completePayment(
        new CompletePaymentCommand({
          userId: wallet.userId,
          amount: point.amount,
          transaction,
        }),
      );

      // then
      await expect(result).rejects.toThrow(
        new AppConflictException(ErrorCodes.PAYMENT_FAILED),
      );
    });

    it('지갑을 찾을 수 없으면 WalletNotFoundException을 던져야 합니다', async () => {
      // given
      const { wallet, point, transaction } = walletServiceFixture();

      walletRepository.getByUserId.mockRejectedValue(new Error());

      // when
      const result = walletService.completePayment(
        new CompletePaymentCommand({
          userId: wallet.userId,
          amount: point.amount,
          transaction,
        }),
      );

      // then
      await expect(result).rejects.toThrow(
        new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND),
      );
    });
  });

  describe('create', () => {
    it('사용자의 지갑을 생성하고 WalletInfo를 반환해야 합니다', async () => {
      // given
      const { wallet } = walletServiceFixture();
      walletRepository.create.mockResolvedValue(wallet);

      // when
      const result = await walletService.create(wallet.userId);

      // then
      expect(result).toEqual(WalletInfo.from(wallet));
    });
  });
});
