import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { Domain } from 'src/common/decorators';
import { OutboxEventRepository } from 'src/infrastructure/database/repositories/outbox-event.repository';
import { CreateOutboxEventCommand, OutboxEventInfo } from '../dtos';
import { OutboxEventModelProps, OutboxEventType } from '../models';

@Domain()
export class OutboxEventService {
  constructor(private readonly outboxEventRepository: OutboxEventRepository) {}

  createOutboxEvent(
    command: CreateOutboxEventCommand,
    transaction?: Prisma.TransactionClient,
  ) {
    return pipe(
      this.outboxEventRepository.create(command, transaction),
      Effect.map(OutboxEventInfo.from),
    );
  }

  findByAggregate(aggregateId: string, eventType: OutboxEventType) {
    return pipe(
      this.outboxEventRepository.findOneByAggregateIdAndEventType(
        aggregateId,
        eventType,
      ),
      Effect.map((outboxEvent) =>
        outboxEvent ? OutboxEventInfo.from(outboxEvent) : null,
      ),
    );
  }

  updateOutboxEvent(
    aggregateId: string,
    eventType: OutboxEventType,
    data: Partial<OutboxEventModelProps>,
  ) {
    return pipe(
      this.outboxEventRepository.updateByAggregateIdAndEventType(
        aggregateId,
        eventType,
        data,
      ),
      Effect.map(OutboxEventInfo.from),
    );
  }
}
