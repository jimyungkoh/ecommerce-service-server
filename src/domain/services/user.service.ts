import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { ErrorCodes } from 'src/common/errors';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { UserRepository } from 'src/infrastructure/database/repositories';
import { SignInCommand, SignUpCommand } from '../dtos/commands/user';
import { UserInfo } from '../dtos/info';
import {
  AppAuthException,
  AppConflictException,
  AppNotFoundException,
} from '../exceptions';
import { CartService } from './cart.service';
import { WalletService } from './wallet.service';
@Injectable()
export class UserService {
  private readonly salt: number;

  constructor(
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    private readonly configService: CustomConfigService,
    private readonly userRepository: UserRepository,
    private readonly cartService: CartService,
    private readonly walletService: WalletService,
  ) {
    this.salt = this.configService.saltRounds;
  }

  async getByEmail(email: string): Promise<UserInfo> {
    try {
      return UserInfo.from(await this.userRepository.getByEmail(email));
    } catch (error) {
      throw new AppNotFoundException(ErrorCodes.USER_NOT_FOUND);
    }
  }

  async signUp(signUpCommand: SignUpCommand) {
    try {
      const user = await this.userRepository
        .create({
          email: signUpCommand.email,
          password: bcrypt.hashSync(signUpCommand.password, this.salt),
        })
        .then(async (user) => {
          await Promise.all([
            this.cartService.create(user.id),
            this.walletService.create(user.id),
          ]);
          return user;
        });

      return new UserInfo({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      throw new AppConflictException(ErrorCodes.USER_ALREADY_EXISTS);
    }
  }

  async signIn(signInCommand: SignInCommand) {
    const user = await this.userRepository
      .getByEmail(signInCommand.email)
      .catch(() => {
        throw new AppNotFoundException(ErrorCodes.USER_NOT_FOUND);
      });

    if (!bcrypt.compareSync(signInCommand.password, user.password)) {
      throw new AppAuthException(ErrorCodes.USER_AUTH_FAILED);
    }
    return UserInfo.from(user);
  }
}
