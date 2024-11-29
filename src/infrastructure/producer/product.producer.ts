// import { Inject } from '@nestjs/common';
// import { ClientKafka } from '@nestjs/microservices';
// import { Effect, pipe } from 'effect';
// import { catchError, firstValueFrom } from 'rxjs';
// import { Infrastructure } from 'src/common/decorators';
// import { KafkaClientKey } from 'src/common/kafka/kafka.module';
// import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
// import { CreateOrderInfo } from 'src/domain/dtos';
// import { OutboxEventTypes } from 'src/domain/models/outbox-event.model';

import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Effect, pipe } from 'effect';
import { catchError, firstValueFrom } from 'rxjs';
import { Infrastructure } from 'src/common/decorators';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import {
  OutboxEventModel,
  OutboxEventTypes,
} from 'src/domain/models/outbox-event.model';
import { KafkaClientKey } from '../../common/kafka/kafka.module';

@Infrastructure()
export class ProductProducer {
  constructor(
    @Inject(KafkaClientKey)
    private readonly kafka: ClientKafka,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  produceOrderDeductStockEvent(key: number, outbox: OutboxEventModel) {
    return pipe(
      Effect.tryPromise(() => {
        return firstValueFrom(
          this.kafka
            .emit(OutboxEventTypes.ORDER_DEDUCT_STOCK, {
              key,
              value: outbox.payload,
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
