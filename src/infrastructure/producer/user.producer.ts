import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Effect, pipe } from 'effect';
import { catchError, firstValueFrom } from 'rxjs';
import { Infrastructure } from 'src/common/decorators/layers';
import { CreateOrderInfo } from 'src/domain/dtos';
import { OutboxEventTypes } from 'src/domain/models/outbox-event.model';

@Infrastructure()
export class UserProducer {
  constructor(@Inject('KAFKA_CLIENT') private readonly kafka: ClientKafka) {}

  produceOrderSuccessEvent(payload: CreateOrderInfo) {
    return pipe(
      Effect.tryPromise(() => {
        return firstValueFrom(
          this.kafka
            .emit(OutboxEventTypes.ORDER_PAYMENT, {
              key: payload.order.id,
              value: JSON.stringify(payload),
            })
            .pipe(
              catchError((err) => {
                throw err;
              }),
            ),
        );
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