import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Effect, pipe } from 'effect';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { ErrorCodes } from 'src/common/errors';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { UserRepository } from 'src/infrastructure/database/repositories';
import { SignInCommand, SignUpCommand } from '../dtos/commands/user';
import { UserInfo } from '../dtos/info';
import { AppAuthException } from '../exceptions';
@Injectable()
export class UserService {
  private readonly salt: number;

  constructor(
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    private readonly configService: CustomConfigService,
    private readonly userRepository: UserRepository,
  ) {
    this.salt = this.configService.saltRounds;
  }

  getByEmail(email: string) {
    return this.userRepository
      .getByEmail(email)
      .pipe(Effect.map(UserInfo.from));
  }

  signUp(signUpCommand: SignUpCommand) {
    return this.userRepository
      .create({
        email: signUpCommand.email,
        password: bcrypt.hashSync(signUpCommand.password, this.salt),
      })
      .pipe(Effect.map(UserInfo.from));
  }

  signIn(signInCommand: SignInCommand) {
    return pipe(
      this.userRepository.getByEmail(signInCommand.email),
      Effect.flatMap((user) => {
        if (!bcrypt.compareSync(signInCommand.password, user.password))
          return Effect.fail(new AppAuthException(ErrorCodes.USER_AUTH_FAILED));

        return Effect.succeed(UserInfo.from(user));
      }),
      Effect.catchAll((error) => Effect.fail(error)),
    );
  }
}
