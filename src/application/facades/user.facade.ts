import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { Application } from 'src/common/decorators';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import {
  CompletePaymentCommand,
  CreateOrderInfo,
  CreateOutboxEventCommand,
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
import { OutboxEventService } from 'src/domain/services/outbox-event.service';
import {
  OutboxEventStatus,
  OutboxEventTypes,
} from '../../domain/models/outbox-event.model';
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
    private readonly outboxEventService: OutboxEventService,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
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

    const emitPaymentEvent = (
      tx?: Prisma.TransactionClient,
      status: OutboxEventStatus = OutboxEventStatus.INIT,
    ) => {
      const command = new CreateOutboxEventCommand({
        aggregateId: `order-${orderInfo.order.id}`,
        eventType: OutboxEventTypes.ORDER_PAYMENT,
        payload: JSON.stringify(orderInfo),
        status,
      });

      return tx
        ? this.outboxEventService.createOutboxEvent(command, tx)
        : this.outboxEventService.createOutboxEvent(command);
    };

    return pipe(
      this.prismaService.transaction(
        (tx) =>
          pipe(
            payment(tx),
            Effect.tap(() => emitPaymentEvent(tx)),
          ),
        {
          maxWait: 10_000,
          timeout: 3_000,
        },
      ),
      Effect.catchAll(() =>
        emitPaymentEvent(undefined, OutboxEventStatus.FAIL),
      ),
    );
  }

  getTotalPoint(userId: number) {
    return this.walletService.getTotalPoint(userId);
  }
}
