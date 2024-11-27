import { Infrastructure } from '../../common/decorators';
import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';
import { CreateOrderInfo } from '../../domain/dtos';
import { Effect, pipe } from 'effect';
import { catchError, firstValueFrom } from 'rxjs';
import { OutboxEventTypes } from '../../domain/models/outbox-event.model';
import { KafkaClientKey } from '../../common/kafka/kafka.module';

@Infrastructure()
export class ProductProducer {
  constructor(
    @Inject(KafkaClientKey)
    private readonly kafka: ClientKafka,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  produceOrderDeductStockEvent(payload: CreateOrderInfo) {
    return pipe(
      Effect.tryPromise(() => {
        return firstValueFrom(
          this.kafka
            .emit(OutboxEventTypes.ORDER_DEDUCT_STOCK, {
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
      }),
    );
  }
}
