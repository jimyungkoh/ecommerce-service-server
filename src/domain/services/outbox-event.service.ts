import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { Domain } from 'src/common/decorators';
import { OutboxEventRepository } from 'src/infrastructure/database/repositories/outbox-event.repository';
import { CreateOutboxEventCommand, OutboxEventInfo } from '../dtos';

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
}
