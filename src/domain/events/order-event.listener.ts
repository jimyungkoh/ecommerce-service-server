import { Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Domain } from 'src/common/decorators';
import { OutboxEventRepository } from 'src/infrastructure/database/repositories/outbox-event.repository';
import { OrderEventProducer } from '../../infrastructure/producer';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';
import { CreateOrderInfo } from '../dtos';
import { OutboxEventTypes } from '../models/outbox-event.model';
import { BaseOutboxEventListener } from './base-outbox-event.listener';
import { Effect, pipe } from 'effect';

@Domain()
export class OrderEventListener extends BaseOutboxEventListener {
  constructor(
    private readonly orderProducer: OrderEventProducer,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    protected readonly outboxEventRepository: OutboxEventRepository,
  ) {
    super(outboxEventRepository);
  }

  @OnEvent(`${OutboxEventTypes.ORDER_CREATED}.before_commit`, {
    async: true,
    promisify: true,
    suppressErrors: false,
  })
  async createOrderOutboxRecord(payload: CreateOrderInfo) {
    const aggregateId = `order-${payload.order.id}`;

    return pipe(
      this.handleBeforeCommitEvent(
        aggregateId,
        payload,
        OutboxEventTypes.ORDER_CREATED,
      ),
      Effect.runPromise,
    );
  }

  @OnEvent(`${OutboxEventTypes.ORDER_CREATED}.after_commit`, {
    async: true,
    promisify: true,
    suppressErrors: false,
  })
  async publishOrderCreatedEvent(payload: CreateOrderInfo) {
    return pipe(
      this.handleAfterCommitEvent(() =>
        this.orderProducer.produceOrderCreatedEvent(payload),
      ),
      Effect.runPromise,
    );
  }
}
