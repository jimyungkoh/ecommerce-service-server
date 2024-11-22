import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Effect, pipe } from 'effect';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { Application } from 'src/common/decorators';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { SignInCommand, SignUpCommand } from 'src/domain/dtos';
import { UserInfo } from 'src/domain/dtos/info';
import { OutboxEventTypes } from 'src/domain/models/outbox-event.model';
import {
  CartService,
  PointService,
  UserService,
  WalletService,
} from 'src/domain/services';
import { UserSignInCriteria, UserSignUpCriteria } from '../dtos/criteria';
import { UserSignInResult } from '../dtos/results';

@Application()
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
    private readonly eventEmitter: EventEmitter2,
  ) {}

  signUp(userSignUpCriteria: UserSignUpCriteria) {
    const userSignUpEffect = this.userService.signUp(
      new SignUpCommand(userSignUpCriteria),
    );

    const afterSignUpEffect = (user: UserInfo) =>
      pipe(
        Effect.all([
          this.cartService.create(user.id),
          this.walletService.create(user.id),
        ]),
        Effect.map(() => user),
      );

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

  processOrderPayment(userId: number, amount: number, aggregateId: string) {
    this.eventEmitter.emit(OutboxEventTypes.ORDER_PAYMENT, {
      info: { userId, amount, aggregateId },
      outboxEvent: { aggregateId, eventType: OutboxEventTypes.ORDER_PAYMENT },
    });
  }

  getTotalPoint(userId: number) {
    return this.walletService.getTotalPoint(userId);
  }
}
