import * as bcrypt from 'bcrypt';
import { Effect, pipe } from 'effect';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { Service } from 'src/common/decorators';
import { UserRepository } from 'src/infrastructure/database/repositories';
import { SignInCommand, SignUpCommand, UserInfo } from '../dtos';
import { UserModel } from '../models';
import { AppAuthException } from '../exceptions';
import { ErrorCodes } from '../../common/errors';

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
        Effect.flatMap((result) =>
          result
            ? Effect.succeed(void 0)
            : Effect.fail(new AppAuthException(ErrorCodes.USER_AUTH_FAILED)),
        ),
      );

    return pipe(
      this.userRepository.getByEmail(signInCommand.email),
      Effect.tap(checkPassword),
      Effect.map(UserInfo.from),
      Effect.tapError((error) => Effect.log(JSON.stringify(error))),
    );
  }
}
