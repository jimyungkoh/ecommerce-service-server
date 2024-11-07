import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Effect, pipe } from 'effect';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { SignInCommand, SignUpCommand } from 'src/domain/dtos';
import { UserInfo } from 'src/domain/dtos/info';
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

  signUp(userSignUpCriteria: UserSignUpCriteria) {
    const userSignUpEffect = this.userService.signUp(
      new SignUpCommand({
        email: userSignUpCriteria.email,
        password: userSignUpCriteria.password,
      }),
    );

    const afterSignUpEffect = (user: UserInfo) =>
      Effect.all([
        this.cartService.create(user.id),
        this.walletService.create(user.id),
      ]).pipe(Effect.map(() => user));

    return pipe(userSignUpEffect, Effect.flatMap(afterSignUpEffect));
  }

  signIn(userSignInCriteria: UserSignInCriteria) {
    const userSignInEffect = this.userService.signIn(
      new SignInCommand({
        email: userSignInCriteria.email,
        password: userSignInCriteria.password,
      }),
    );

    const generateAccessToken = (user: UserInfo) =>
      this.jwtService.sign(
        {
          sub: user.email,
        },
        {
          expiresIn: '1h',
          secret: this.customConfigService.jwtSecret,
        },
      );

    return pipe(
      userSignInEffect,
      Effect.map(generateAccessToken),
      Effect.map(UserSignInResult.from),
    );
  }

  chargePoint(userId: number, amount: number) {
    return this.pointService.chargePoint(userId, amount);
  }

  getTotalPoint(userId: number) {
    return this.walletService.getTotalPoint(userId);
  }
}
