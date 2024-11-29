import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Effect, pipe } from 'effect';
import { catchError, firstValueFrom } from 'rxjs';
import { Infrastructure } from 'src/common/decorators/layers';
import {
  OutboxEventModel,
  OutboxEventTypes,
} from 'src/domain/models/outbox-event.model';
import { KafkaClientKey } from '../../common/kafka/kafka.module';

@Infrastructure()
export class UserProducer {
  constructor(
    @Inject(KafkaClientKey)
    private readonly kafka: ClientKafka,
  ) {}

  produceOrderSuccessEvent(key: number, outbox: OutboxEventModel) {
    return pipe(
      Effect.tryPromise(() => {
        return firstValueFrom(
          this.kafka
            .emit(OutboxEventTypes.ORDER_PAYMENT, {
              key: key,
              value: outbox.payload,
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
