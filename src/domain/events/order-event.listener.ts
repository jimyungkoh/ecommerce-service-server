import { OnEvent } from '@nestjs/event-emitter';
import { Effect, pipe } from 'effect';
import { Domain } from 'src/common/decorators';
import { OutboxEventRepository } from 'src/infrastructure/database/repositories/outbox-event.repository';
import { OrderProducer } from 'src/infrastructure/producer/order.producer';
import { CreateOrderInfo, OutboxEventInfo } from '../dtos';
import {
  OutboxEventStatus,
  OutboxEventTypes,
} from '../models/outbox-event.model';

@Domain()
export class OrderEventListener {
  constructor(
    private readonly orderProducer: OrderProducer,
    private readonly outboxEventRepository: OutboxEventRepository,
  ) {}

  @OnEvent(OutboxEventTypes.ORDER_CREATED)
  handleOrderCreated(payload: {
    info: CreateOrderInfo;
    outboxEvent: OutboxEventInfo;
  }) {
    pipe(
      this.orderProducer.produceOrderCreatedEvent(payload.info),
      Effect.catchAll(() =>
        this.outboxEventRepository.updateByAggregateIdAndEventType(
          payload.outboxEvent.aggregateId,
          payload.outboxEvent.eventType,
          {
            status: OutboxEventStatus.FAIL,
          },
        ),
      ),
    );
  }

  @OnEvent('order_failed')
  handleOrderFailed(payload: { aggregateId: string }) {
    this.orderProducer.produceOrderFailedEvent(payload.aggregateId);
  }
}
