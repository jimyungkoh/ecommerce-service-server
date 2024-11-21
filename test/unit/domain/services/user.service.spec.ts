import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Effect } from 'effect';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { ErrorCodes } from 'src/common/errors';
import { TransientLoggerServiceToken } from 'src/common/logger';
import { SignInCommand } from 'src/domain/dtos/commands/user/sign-in.command';
import { SignUpCommand } from 'src/domain/dtos/commands/user/sign-up.command';
import { UserInfo } from 'src/domain/dtos/info';
import {
  AppAuthException,
  AppConflictException,
  AppNotFoundException,
} from 'src/domain/exceptions';
import { UserModel } from 'src/domain/models';
import { UserService } from 'src/domain/services';
import { UserRepository } from 'src/infrastructure/database/repositories';
import { logger } from 'test/integration/test-containers/setup-tests';

describe('UserService', () => {
  let moduleFixture: TestingModule;
  let userService: UserService;
  let userRepository: DeepMockProxy<UserRepository>;
  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: TransientLoggerServiceToken,
          useValue: logger,
        },
        { provide: UserRepository, useValue: mockDeep<UserRepository>() },
        {
          provide: CustomConfigService,
          useValue: mockDeep<CustomConfigService>({
            saltRounds: 10,
          }),
        },
      ],
    }).compile();

    userService = moduleFixture.get(UserService);
    userRepository = moduleFixture.get(UserRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('signUp', () => {
    it('유저를 생성하고 UserInfo를 반환해야 합니다', async () => {
      // given
      const signUpCommand = new SignUpCommand({
        email: 'testUser123',
        password: 'testPassword123',
      });

      const userStub = new UserModel({
        id: 1,
        email: signUpCommand.email,
        password: 'password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.create.mockImplementation(() => Effect.succeed(userStub));

      // when
      const resultUser = await Effect.runPromise(
        userService.signUp(signUpCommand),
      );
      const expectedUser = UserInfo.from(userStub);

      // then
      expect(resultUser).toEqual(expectedUser);
    });

    it('중복된 이메일로 가입을 시도하면 AppConflictException을 던져야 합니다', async () => {
      // given
      const signUpCommand = new SignUpCommand({
        email: 'testUser123',
        password: 'testPassword123',
      });
      userRepository.create.mockImplementation(() =>
        Effect.fail(new AppConflictException(ErrorCodes.USER_ALREADY_EXISTS)),
      );

      // when
      const signUpPromise = Effect.runPromise(
        userService.signUp(signUpCommand),
      );
      const expectedException = new AppConflictException(
        ErrorCodes.USER_ALREADY_EXISTS,
      );

      // then
      await expect(signUpPromise).rejects.toThrow(expectedException);
    });
  });

  describe('signIn', () => {
    it('유효한 자격 증명으로 로그인해야 합니다', async () => {
      // given
      const signInCommand = new SignInCommand({
        email: 'testUser123',
        password: 'testPassword123',
      });

      const userStub = new UserModel({
        id: 1,
        email: signInCommand.email,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.getByEmail.mockImplementation(() =>
        Effect.succeed(userStub),
      );

      // bcrypt.compare 모킹 설정
      const bcryptCompare = jest.fn().mockResolvedValue(true);
      (bcrypt.compare as jest.Mock) = bcryptCompare;

      // when
      const resultUser = await Effect.runPromise(
        userService.signIn(signInCommand),
      );

      // then
      expect(resultUser.email).toEqual(signInCommand.email);
    });

    it('존재하지 않는 이메일로 로그인 시도 시 AppNotFoundException을 던져야 합니다', async () => {
      // given
      const signInCommand = new SignInCommand({
        email: 'nonexistent@example.com',
        password: 'testPassword123',
      });
      userRepository.getByEmail.mockImplementation(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.USER_NOT_FOUND)),
      );

      // when
      const signInPromise = Effect.runPromise(
        userService.signIn(signInCommand),
      );

      // then
      await expect(signInPromise).rejects.toThrow(
        new AppNotFoundException(ErrorCodes.USER_NOT_FOUND),
      );
    });

    it('잘못된 비밀번호로 로그인 시도 시 AppAuthException을 던져야 합니다', async () => {
      // given
      const signInCommand = new SignInCommand({
        email: 'testUser123',
        password: 'wrongPassword',
      });

      const userStub = new UserModel({
        id: 1,
        email: signInCommand.email,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.getByEmail.mockImplementation(() =>
        Effect.succeed(userStub),
      );

      // bcrypt.compare 모킹 설정
      const bcryptCompare = jest.fn().mockResolvedValue(false);
      (bcrypt.compare as jest.Mock) = bcryptCompare;

      // when
      const signInPromise = Effect.runPromise(
        userService.signIn(signInCommand),
      );

      // then
      await expect(signInPromise).rejects.toThrow(
        new AppAuthException(ErrorCodes.USER_AUTH_FAILED),
      );
    });
  });
});
