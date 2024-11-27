import { Effect, pipe } from 'effect';
import { OutboxEventRepository } from '../../infrastructure/database/repositories/outbox-event.repository';
import { CreateOrderInfo } from '../dtos';
import {
  OutboxEventStatus,
  OutboxEventType,
} from '../models/outbox-event.model';

export abstract class BaseOutboxEventListener {
  protected constructor(
    protected readonly outboxEventRepository: OutboxEventRepository,
  ) {}

  protected handleBeforeCommitEvent(
    aggregateId: string,
    payload: CreateOrderInfo,
    eventType: OutboxEventType,
  ) {
    const outboxEvent = this.outboxEventRepository.findByAggregateId(
      aggregateId,
      eventType,
    );

    const createOutboxEvent = () =>
      this.outboxEventRepository.create({
        aggregateId,
        eventType,
        payload: JSON.stringify(payload),
      });

    return pipe(
      outboxEvent,
      Effect.flatMap((outboxEvent) =>
        outboxEvent && outboxEvent?.status !== OutboxEventStatus.INIT
          ? Effect.fail(void 0)
          : createOutboxEvent(),
      ),
    );
  }

  protected handleAfterCommitEvent<T>(
    producer: () => Effect.Effect<T, Error, never>,
  ) {
    return pipe(producer());
  }
}
