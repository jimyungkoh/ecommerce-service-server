import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Effect, pipe } from 'effect';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { Domain } from 'src/common/decorators';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { UserRepository } from 'src/infrastructure/database/repositories';
import { ErrorCodes } from '../../common/errors';
import { SignInCommand, SignUpCommand, UserInfo } from '../dtos';
import { AppAuthException } from '../exceptions';
import { UserModel } from '../models';

@Domain()
export class UserService {
  private readonly salt: number;

  constructor(
    private readonly configService: CustomConfigService,
    private readonly userRepository: UserRepository,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {
    this.salt = this.configService.saltRounds;
  }

  getByEmail(email: string) {
    return this.userRepository.getByEmail(email);
  }

  signUp(signUpCommand: SignUpCommand) {
    return pipe(
      this.userRepository.create({
        email: signUpCommand.email,
        password: bcrypt.hashSync(signUpCommand.password, this.salt),
      }),
      Effect.map(UserInfo.from),
    );
  }

  signIn(signInCommand: SignInCommand) {
    const verifyPasswordAndGetUserInfo = (user: UserModel) =>
      pipe(
        Effect.tryPromise(() =>
          bcrypt.compare(signInCommand.password, user.password),
        ),
        Effect.flatMap((result) =>
          result
            ? Effect.succeed(void 0)
            : Effect.fail(new AppAuthException(ErrorCodes.USER_AUTH_FAILED)),
        ),
        Effect.map(() => UserInfo.from(user)),
      );

    return pipe(
      this.userRepository.getByEmail(signInCommand.email),
      Effect.flatMap((user) =>
        user
          ? verifyPasswordAndGetUserInfo(user)
          : Effect.fail(new AppAuthException(ErrorCodes.USER_AUTH_FAILED)),
      ),
    );
  }
}
