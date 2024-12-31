import { Controller, Inject, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Effect, Fiber, pipe } from 'effect';
import { MurLockService } from 'murlock';
import { ProductFacade } from 'src/application/facades';
import { OutboxEventTypes } from 'src/domain/models/outbox-event.model';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';
import { CreateOrderInfo } from '../../domain/dtos';
import { ConsumerInterceptor } from '../interceptors/consumer.interceptor';

@Controller()
@UseInterceptors(ConsumerInterceptor)
export class ProductEventConsumer {
  constructor(
    private readonly productFacade: ProductFacade,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    private readonly murLock: MurLockService,
  ) {}

  @MessagePattern(OutboxEventTypes.ORDER_CREATED)
  handleOrderCreated(@Payload() payload: string) {
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
          this.murLock.runWithLock(OutboxEventTypes.ORDER_CREATED, 4_000, () =>
            Effect.runPromise(fn),
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
          this.productFacade.processOrderDeductStock(orderInfo),
        ),
      ),
    );
  }
}
