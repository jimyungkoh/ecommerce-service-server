import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { SignInCommand, SignUpCommand } from 'src/domain/dtos';
import { PointInfo } from 'src/domain/dtos/info';
import {
  CartService,
  PointService,
  UserService,
  WalletService,
} from 'src/domain/services';
import { UserSignInCriteria, UserSignUpCriteria } from '../dtos/criteria';
import { UserSignInResult } from '../dtos/results';

@Injectable()
export class UserFacade {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly pointService: PointService,
    private readonly cartService: CartService,
    private readonly walletService: WalletService,
    private readonly customConfigService: CustomConfigService,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  async signUp(userSignUpCriteria: UserSignUpCriteria) {
    const user = await this.userService.signUp(
      new SignUpCommand({
        email: userSignUpCriteria.email,
        password: userSignUpCriteria.password,
      }),
    );

    await Promise.all([
      this.cartService.create(user.id),
      this.walletService.create(user.id),
    ]);

    return user;
  }

  async signIn(userSignInCriteria: UserSignInCriteria) {
    const user = await this.userService.signIn(
      new SignInCommand({
        email: userSignInCriteria.email,
        password: userSignInCriteria.password,
      }),
    );

    const accessToken = this.jwtService.sign(
      {
        sub: user.email,
      },
      {
        expiresIn: '1h',
        secret: this.customConfigService.jwtSecret,
      },
    );

    return UserSignInResult.from(accessToken);
  }

  async chargePoint(userId: number, amount: number): Promise<PointInfo> {
    try {
      const point = await this.pointService.chargePoint(userId, amount);
      return point;
    } catch (error) {
      throw error;
    }
  }

  async getTotalPoint(userId: number): Promise<number> {
    return await this.walletService.getTotalPoint(userId);
  }
}
