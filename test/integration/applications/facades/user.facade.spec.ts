import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import Decimal from 'decimal.js';
import {
  UserSignInCriteria,
  UserSignUpCriteria,
} from 'src/application/dtos/criteria';
import { UserSignInResult } from 'src/application/dtos/results';
import { UserFacade } from 'src/application/facades';
import { ConfigurationModule } from 'src/common/config';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { ErrorCodes } from 'src/common/errors';
import { LoggerModule } from 'src/common/logger';
import { PointInfo } from 'src/domain/dtos/info';
import {
  AppAuthException,
  AppConflictException,
  AppNotFoundException,
} from 'src/domain/exceptions';
import { PointService, UserService, WalletService } from 'src/domain/services';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { TransactionType } from 'src/infrastructure/dtos/domains';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import {
  logger,
  prismaService,
  testDataFactory,
} from 'test/integration/test-containers/setup-tests';

describe('UserFacade', () => {
  let userFacade: UserFacade;
  let configService: CustomConfigService;
  let jwtService: JwtService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigurationModule,
        InfrastructureModule,
        LoggerModule,
        JwtModule.registerAsync({
          useFactory: async (configService: CustomConfigService) => ({
            secret: configService.jwtSecret,
            signOptions: { expiresIn: '1h' },
          }),
          inject: [CustomConfigService],
        }),
      ],
      providers: [
        UserFacade,
        UserService,
        PointService,
        WalletService,
        JwtService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    userFacade = moduleRef.get<UserFacade>(UserFacade);
    jwtService = moduleRef.get<JwtService>(JwtService);
    configService = moduleRef.get<CustomConfigService>(CustomConfigService);
  });

  beforeEach(async () => {
    await testDataFactory.cleanupDatabase();
  });

  describe('signUp', () => {
    it('사용자가 성공적으로 가입해야 합니다', async () => {
      //given
      const signUpCriteria: UserSignUpCriteria = {
        email: 'test@example.com',
        password: 'password123',
      };

      //when
      const result = await userFacade.signUp(signUpCriteria);

      //then
      expect(result.email).toEqual(signUpCriteria.email);
    });

    it('이미 존재하는 이메일로 가입하면 예외가 발생해야 합니다', async () => {
      //given
      const duplicateEmail = 'duplicate@example.com';
      const user = await testDataFactory.createUser({
        email: duplicateEmail,
      });
      logger.info(`data: ${JSON.stringify(user)}`);

      const signUpCriteria: UserSignUpCriteria = {
        email: duplicateEmail,
        password: 'password123',
      };

      // when
      const resultPromise = userFacade.signUp(signUpCriteria);

      // then
      await expect(resultPromise).rejects.toThrow(
        new AppConflictException(ErrorCodes.USER_ALREADY_EXISTS),
      );
    });
  });

  describe('signIn', () => {
    it('사용자가 성공적으로 로그인하고 토큰을 반환해야 합니다', async () => {
      //given
      const signInCriteria: UserSignInCriteria = {
        email: 'test@example.com',
        password: 'password123',
      };

      await testDataFactory.createUser({
        email: signInCriteria.email,
        password: bcrypt.hashSync(
          signInCriteria.password,
          configService.saltRounds,
        ),
      });

      //when
      const result = await userFacade.signIn(signInCriteria);
      const expected = new UserSignInResult(
        jwtService.sign(
          { sub: signInCriteria.email },
          {
            expiresIn: '1h',
            secret: configService.jwtSecret,
          },
        ),
      );

      expect(result).toEqual(expected);
    });

    it('존재하지 않는 이메일로 로그인하면 예외가 발생해야 합니다', async () => {
      //given
      const signInCriteria: UserSignInCriteria = {
        email: 'test@example.com',
        password: 'password123',
      };

      // when
      const resultPromise = userFacade.signIn(signInCriteria);

      // then
      await expect(resultPromise).rejects.toThrow(
        new AppNotFoundException(ErrorCodes.USER_NOT_FOUND),
      );
    });

    it('비밀번호가 일치하지 않으면 예외가 발생해야 합니다', async () => {
      //given
      await testDataFactory.createUser({
        email: 'test@example.com',
        password: bcrypt.hashSync('rightPassword', configService.saltRounds),
      }); // 테스트용 유저 생성

      const signInCriteria: UserSignInCriteria = {
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      // when
      const resultPromise = userFacade.signIn(signInCriteria);

      // then
      await expect(resultPromise).rejects.toThrow(
        new AppAuthException(ErrorCodes.USER_AUTH_FAILED),
      );
    });
  });

  describe('chargePoint', () => {
    it('사용자 포인트를 성공적으로 충전해야 합니다', async () => {
      //given
      const user = await testDataFactory.createUser();
      const wallet = await testDataFactory.createWallet(user.id);
      const amount = new Decimal(100);

      //when
      const result = await userFacade.chargePoint(user.id, amount.toNumber());
      const expected = new PointInfo({
        id: expect.any(BigInt),
        walletId: wallet.id,
        amount: amount,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        expiredAt: null,
        transactionType: TransactionType.CHARGE,
      });

      //then
      expect(result.walletId).toBe(expected.walletId);
      expect(result.amount).toBe(expected.amount);
      expect(result.expiredAt).toBe(expected.expiredAt);
      expect(result.transactionType).toBe(expected.transactionType);
    });

    it('지갑이 존재하지 않는 경우 예외가 발생해야 합니다', async () => {
      //given
      const amount = new Decimal(100);
      const invalidUserId = 100;

      //when
      const resultPromise = userFacade.chargePoint(
        invalidUserId,
        amount.toNumber(),
      );

      //then
      await expect(resultPromise).rejects.toThrow(
        new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND),
      );
    });

    it(`동시에 포인트를 충전할 때 낙관적 잠금이 정확히 동작해야 합니다
        - 성공한 경우의 포인트 충전
        - 실패한 경우의 예외 처리
        - 최종 상태 확인
          (지갑의 포인트와 버전은 성공한 트랜잭션 수를 반영해 정확한 값을 반환해야 함)
      `, async () => {
      // given: 사용자와 지갑 생성
      const user = await testDataFactory.createUser();
      const wallet = await testDataFactory.createWallet(user.id);
      const amount = new Decimal(100);
      const numberOfTransactions = 1000;

      // when: 여러 트랜잭션을 동시에 실행
      const results = await Promise.allSettled(
        Array.from({ length: numberOfTransactions }, () =>
          userFacade.chargePoint(user.id, amount.toNumber()),
        ),
      );

      // then: 성공한 트랜잭션 필터링
      const successfulTransactions = results.filter(
        (result) => result.status === 'fulfilled',
      );

      logger.info(
        `동시에 포인트를 충전할 때 낙관적 잠금이 정확히 동작해야 합니다: ${successfulTransactions.length.toString()}`,
      );
      const failedTransactions = results.filter(
        (result) => result.status === 'rejected',
      );

      // 최소 하나는 성공해야 함
      expect(successfulTransactions.length).toBeGreaterThan(0);
      // 실패한 트랜잭션은 모두 충돌 예외여야 함
      failedTransactions.forEach((result) => {
        expect(result.status).toBe('rejected');
        expect(result.reason).toBeInstanceOf(AppConflictException);
        expect(result.reason.message).toBe(
          ErrorCodes.POINT_CHARGE_FAILED.message,
        );
      });

      // 최종 상태 확인: 지갑의 포인트와 버전 확인
      const finalWallet = await testDataFactory.getWallet(user.id);
      // 성공한 트랜잭션 수만큼 포인트가 증가해야 함
      expect(finalWallet.totalPoint.toString()).toBe(
        amount.mul(successfulTransactions.length).toString(),
      );
      // 버전이 성공한 트랜잭션 수만큼 증가해야 함
      expect(finalWallet.version).toBe(
        wallet.version + BigInt(successfulTransactions.length),
      );
    });
  });

  describe('getTotalPoint', () => {
    it('사용자의 총 포인트를 조회해야 합니다', async () => {
      //given
      const user = await testDataFactory.createUser().then(async (user) => {
        await testDataFactory.createWallet(user.id);
        return user;
      });

      //when
      const result = await userFacade.getTotalPoint(user.id);
      const expected = new Decimal(0).toString();

      //then
      expect(result).toEqual(expected);
    });

    it('지갑이 없는 경우 예외가 발생해야 합니다', async () => {
      //given
      const invalidUserId = 100;

      //when
      const resultPromise = userFacade.getTotalPoint(invalidUserId);

      //then
      await expect(resultPromise).rejects.toThrow(
        new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND),
      );
    });
  });
});
