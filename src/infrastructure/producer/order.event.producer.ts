import { Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Effect, pipe } from 'effect';
import { firstValueFrom } from 'rxjs';
import { Infrastructure } from 'src/common/decorators/layers';
import {
  OutboxEventModel,
  OutboxEventTypes,
} from 'src/domain/models/outbox-event.model';
// import { KafkaClientKey } from '../../common/kafka/kafka.module';
import { KafkaClientKey } from 'src/common/kafka/kafka.module';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';

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
      Effect.tryPromise(() =>
        firstValueFrom(
          this.kafka.emit(OutboxEventTypes.ORDER_CREATED, {
            key,
            value: outbox.payload,
          }),
        ),
      ),
      Effect.retry({ times: 3, delay: 1_000 }),
    );
  }
}
