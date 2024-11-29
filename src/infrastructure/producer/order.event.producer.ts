import { Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Effect, pipe } from 'effect';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { Infrastructure } from 'src/common/decorators/layers';
import {
  OutboxEventModel,
  OutboxEventTypes,
} from 'src/domain/models/outbox-event.model';
// import { KafkaClientKey } from '../../common/kafka/kafka.module';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';
import { KafkaClientKey } from 'src/common/kafka/kafka.module';

@Infrastructure()
export class OrderEventProducer implements OnModuleInit {
  constructor(
    @Inject(KafkaClientKey)
    private readonly kafka: ClientKafka,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  async onModuleInit() {
    await this.kafka.connect();
  }

  produceOrderCreatedEvent(key: number, outbox: OutboxEventModel) {
    return pipe(
      Effect.try(() => {
        return {
          key,
          value: outbox.payload,
        };
      }),
      Effect.flatMap((message) =>
        Effect.tryPromise(() =>
          firstValueFrom(
            this.kafka.emit(OutboxEventTypes.ORDER_CREATED, message).pipe(
              timeout(5000),
              catchError((err) => {
                this.logger.error(
                  `카프카 이벤트 발행 실패: ${JSON.stringify(err)}`,
                );
                throw err;
              }),
            ),
          ),
        ),
      ),
    );
  }
}
