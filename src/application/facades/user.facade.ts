import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { Application } from 'src/common/decorators';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import {
  CompletePaymentCommand,
  CreateOrderInfo,
  SignInCommand,
  SignUpCommand,
} from 'src/domain/dtos';
import { UserInfo } from 'src/domain/dtos/info';
import {
  CartService,
  PointService,
  UserService,
  WalletService,
} from 'src/domain/services';
import { OutboxEventTypes } from '../../domain/models/outbox-event.model';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { UserSignInCriteria, UserSignUpCriteria } from '../dtos/criteria';
import { UserSignInResult } from '../dtos/results';

@Application()
export class UserFacade {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly pointService: PointService,
    private readonly prismaService: PrismaService,
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

  processOrderPayment(orderInfo: CreateOrderInfo) {
    const payment = (tx: Prisma.TransactionClient) => {
      const { userId } = orderInfo.order;
      const amount = orderInfo.orderItems
        .map((item) => item.price * item.quantity)
        .reduce((acc, cur) => acc + cur, 0);

      return this.walletService.completePayment(
        new CompletePaymentCommand({ userId, amount }),
        tx,
      );
    };

    const emitPaymentEvent = () =>
      Effect.tryPromise(
        async () =>
          await this.eventEmitter.emitAsync(
            `${OutboxEventTypes.ORDER_PAYMENT}.before_commit`,
            orderInfo,
          ),
      );

    const emitPaymentFailedEvent = () =>
      pipe(
        Effect.tryPromise(async () => {
          this.logger.info('이벤트 발생');
          return await this.eventEmitter.emitAsync(
            `${OutboxEventTypes.ORDER_PAYMENT}.failed`,
            orderInfo,
          );
        }),
      );

    return pipe(
      this.prismaService.transaction((tx) =>
        pipe(payment(tx), Effect.tap(emitPaymentEvent)),
      ),
      Effect.catchAll(emitPaymentFailedEvent),
    );
  }

  getTotalPoint(userId: number) {
    return this.walletService.getTotalPoint(userId);
  }
}
