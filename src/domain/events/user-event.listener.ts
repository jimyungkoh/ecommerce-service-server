import { OnEvent } from '@nestjs/event-emitter';
import { Effect, pipe } from 'effect';
import { Domain } from 'src/common/decorators';
import { OutboxEventRepository } from 'src/infrastructure/database/repositories/outbox-event.repository';
import { CreateOrderInfo } from '../dtos';
import {
  OutboxEventStatus,
  OutboxEventTypes,
} from '../models/outbox-event.model';
import { BaseOutboxEventListener } from './base-outbox-event.listener';

@Domain()
export class UserEventListener extends BaseOutboxEventListener {
  constructor(protected readonly outboxEventRepository: OutboxEventRepository) {
    super(outboxEventRepository);
  }

  @OnEvent(`${OutboxEventTypes.ORDER_PAYMENT}.before_commit`, {
    async: true,
    promisify: true,
    suppressErrors: false,
  })
  async handleOrderPayment(payload: CreateOrderInfo) {
    const aggregateId = `order-${payload.order.id}`;

    return pipe(
      this.handleBeforeCommitEvent(
        aggregateId,
        payload,
        OutboxEventTypes.ORDER_PAYMENT,
      ),
      Effect.runPromise,
    );
  }

  @OnEvent(`${OutboxEventTypes.ORDER_PAYMENT}.failed`, {
    async: true,
    promisify: true,
    suppressErrors: false,
  })
  async publishOrderPaymentFailedEvent(payload: CreateOrderInfo) {
    console.log('원복 아웃박스 시작');
    return await pipe(
      this.outboxEventRepository.create({
        eventType: OutboxEventTypes.ORDER_PAYMENT,
        aggregateId: `order-${payload.order.id}`,
        payload: JSON.stringify(payload),
        status: OutboxEventStatus.FAIL,
      }),
      Effect.runPromise,
    );
  }
}
