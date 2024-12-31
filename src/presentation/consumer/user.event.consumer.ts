import { Controller, Inject, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Effect, Fiber, pipe } from 'effect';
import { MurLockService } from 'murlock';
import { UserFacade } from 'src/application/facades';
import { CreateOrderInfo } from 'src/domain/dtos';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';
import { OutboxEventTypes } from '../../domain/models/outbox-event.model';
import { ConsumerInterceptor } from '../interceptors';

@Controller()
@UseInterceptors(ConsumerInterceptor)
export class UserEventConsumer {
  constructor(
    private readonly userFacade: UserFacade,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    private readonly murLock: MurLockService,
  ) {}

  @MessagePattern(OutboxEventTypes.ORDER_DEDUCT_STOCK)
  handleDeductStock(@Payload() payload: string) {
    const orderInfo = Effect.sync(() =>
      typeof payload === 'string'
        ? typeof payload === 'string' && payload.startsWith('{')
          ? (JSON.parse(payload) as CreateOrderInfo)
          : (JSON.parse(JSON.parse(payload)) as CreateOrderInfo)
        : (payload as CreateOrderInfo),
    );

    const runWithMurlock = (fn: Effect.Effect<unknown, Error, never>) =>
      pipe(
        Effect.tryPromise(() =>
          this.murLock.runWithLock(
            OutboxEventTypes.ORDER_DEDUCT_STOCK,
            4_000,
            () => Effect.runPromise(fn),
          ),
        ),
        Effect.catchAll((error) => {
          this.logger.error(error.message);
          return Effect.succeed(null);
        }),
      );

    return runWithMurlock(
      pipe(
        orderInfo,
        Effect.fork,
        Effect.flatMap((fiber) => Fiber.join(fiber)),
        Effect.flatMap((orderInfo) =>
          this.userFacade.processOrderPayment(orderInfo),
        ),
      ),
    );
  }
}
