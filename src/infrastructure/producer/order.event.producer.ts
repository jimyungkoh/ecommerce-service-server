import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Effect, pipe } from 'effect';
import { catchError, firstValueFrom } from 'rxjs';
import { Infrastructure } from 'src/common/decorators/layers';
import { CreateOrderInfo } from 'src/domain/dtos';
import { OutboxEventTypes } from 'src/domain/models/outbox-event.model';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';

@Infrastructure()
export class OrderEventProducer {
  constructor(
    @Inject('KAFKA_CLIENT')
    private readonly kafka: ClientKafka,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  produceOrderCreatedEvent(payload: CreateOrderInfo) {
    return pipe(
      Effect.tryPromise(() => {
        const result = firstValueFrom(
          this.kafka
            .emit(OutboxEventTypes.ORDER_CREATED, {
              key: payload.order.id,
              value: JSON.stringify(payload),
            })
            .pipe(
              catchError((err) => {
                this.logger.error(`예외발생: ${err}`);
                throw err;
              }),
            ),
        );

        this.logger.info(
          `Order created event emitted: ${JSON.stringify(payload)}`,
        );

        return result;
      }),
    );
  }

  produceOrderFailedEvent(aggregateId: string) {
    return Effect.tryPromise(() =>
      firstValueFrom(
        this.kafka.emit(OutboxEventTypes.ORDER_FAILED, { aggregateId }),
      ),
    );
  }
}
