import * as bcrypt from 'bcrypt';
import { Effect, pipe } from 'effect';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { Service } from 'src/common/decorators';
import { ErrorCodes } from 'src/common/errors';
import { UserRepository } from 'src/infrastructure/database/repositories';
import { SignInCommand, SignUpCommand, UserInfo } from '../dtos';
import { AppAuthException } from '../exceptions';
import { UserModel } from '../models';

@Service()
export class UserService {
  private readonly salt: number;

  constructor(
    private readonly configService: CustomConfigService,
    private readonly userRepository: UserRepository,
  ) {
    this.salt = this.configService.saltRounds;
  }

  getByEmail(email: string) {
    return pipe(
      this.userRepository.getByEmail(email),
      Effect.map(UserInfo.from),
    );
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
    const checkPassword = (user: UserModel) =>
      pipe(
        Effect.tryPromise(() =>
          bcrypt.compare(signInCommand.password, user.password),
        ),
        Effect.tap((result) =>
          !result
            ? Effect.fail(new AppAuthException(ErrorCodes.USER_AUTH_FAILED))
            : Effect.succeed(void 0),
        ),
      );

    return pipe(
      this.userRepository.getByEmail(signInCommand.email),
      Effect.tap(checkPassword),
      Effect.map(UserInfo.from),
      Effect.catchAll((error) => Effect.fail(error)),
    );
  }
}
