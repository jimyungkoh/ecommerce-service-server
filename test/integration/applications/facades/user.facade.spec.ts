import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Effect } from 'effect';
import { AppModule } from 'src/app.module';
import {
  UserSignInCriteria,
  UserSignUpCriteria,
} from 'src/application/dtos/criteria';
import { UserSignInResult } from 'src/application/dtos/results';
import { UserFacade } from 'src/application/facades';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { ErrorCodes } from 'src/common/errors';
import { PointInfo } from 'src/domain/dtos/info';
import {
  AppAuthException,
  AppConflictException,
  AppNotFoundException,
} from 'src/domain/exceptions';
import { TransactionType } from 'src/domain/models';
import { testDataFactory } from 'test/integration/test-containers/setup-tests';

describe('UserFacade', () => {
  let userFacade: UserFacade;
  let configService: CustomConfigService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    userFacade = moduleRef.get<UserFacade>(UserFacade);
    jwtService = moduleRef.get<JwtService>(JwtService);
    configService = moduleRef.get<CustomConfigService>(CustomConfigService);
  });

  afterEach(async () => {
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
      const result = await Effect.runPromise(userFacade.signUp(signUpCriteria));

      //then
      expect(result.email).toEqual(signUpCriteria.email);
    });

    it('이미 존재하는 이메일로 가입하면 예외가 발생해야 합니다', async () => {
      //given
      const duplicateEmail = 'duplicate@example.com';
      const user = await testDataFactory.createUser({
        email: duplicateEmail,
      });
      const signUpCriteria: UserSignUpCriteria = {
        email: duplicateEmail,
        password: 'password123',
      };

      // when
      const resultPromise = Effect.runPromise(
        userFacade.signUp(signUpCriteria),
      );

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
      const result = await Effect.runPromise(userFacade.signIn(signInCriteria));
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
      const resultPromise = Effect.runPromise(
        userFacade.signIn(signInCriteria),
      );

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
      const resultPromise = Effect.runPromise(
        userFacade.signIn(signInCriteria),
      );

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

      const amount = 100;

      //when
      const result = await Effect.runPromise(
        userFacade.chargePoint(user.id, amount),
      );
      const expected = new PointInfo({
        id: expect.any(Number),
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
      const amount = 100;
      const invalidUserId = 100;

      //when
      const resultPromise = Effect.runPromise(
        userFacade.chargePoint(invalidUserId, amount),
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
      await testDataFactory.createWallet(user.id);
      const amount = 100;
      const numberOfTransactions = 1000;

      // when: 여러 트랜잭션을 동시에 실행
      const promises = Array.from({ length: numberOfTransactions }, () =>
        Effect.runPromise(userFacade.chargePoint(user.id, amount)),
      );
      const results = await Promise.allSettled(promises);

      const successfulTransactions = results.filter(
        (result) => result.status === 'fulfilled',
      );
      const failedTransactions = results.filter(
        (result) => result.status === 'rejected',
      );
      expect(successfulTransactions.length).toBeGreaterThan(0);

      failedTransactions.forEach((result) => {
        expect(result.status).toBe('rejected');
        expect(result.reason.message).toBe('포인트 충전에 실패했습니다.');
        expect(result.reason).toBeInstanceOf(Error);
      });

      const finalWallet = await testDataFactory.getWallet(user.id);
      expect(finalWallet.totalPoint).toBe(
        amount * successfulTransactions.length,
      );
      expect(finalWallet.version).toBe(successfulTransactions.length);
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
      const result = await Effect.runPromise(userFacade.getTotalPoint(user.id));
      const expected = 0;

      //then
      expect(result).toEqual(expected);
    });

    it('지갑이 없는 경우 예외가 발생해야 합니다', async () => {
      //given
      const invalidUserId = 100;

      //when
      const resultPromise = Effect.runPromise(
        userFacade.getTotalPoint(invalidUserId),
      );

      //then
      await expect(resultPromise).rejects.toThrow(
        new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND),
      );
    });
  });
});
