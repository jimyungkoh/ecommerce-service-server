import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { Infrastructure } from 'src/common/decorators';
import { OutboxEventModel } from 'src/domain/models/outbox-event.model';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Infrastructure()
export class OutboxEventRepository
  implements BaseRepository<OutboxEventModel, OutboxEventModel>
{
  constructor(private readonly prisma: PrismaService) {}

  create(
    outboxEvent: Prisma.OutboxEventCreateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OutboxEventModel, Error> {
    const prisma = transaction ?? this.prisma;

    return pipe(
      Effect.tryPromise(() => prisma.outboxEvent.create({ data: outboxEvent })),
      Effect.map(OutboxEventModel.from),
    );
  }

  update(
    id: number,
    data: Prisma.OutboxEventUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OutboxEventModel, Error> {
    const prisma = transaction ?? this.prisma;
    return pipe(
      Effect.tryPromise(() =>
        prisma.outboxEvent.update({ where: { id }, data }),
      ),
      Effect.map(OutboxEventModel.from),
    );
  }

  updateByAggregateIdAndEventType(
    aggregateId: string,
    eventType: string,
    data: Prisma.OutboxEventUpdateInput,
  ): Effect.Effect<OutboxEventModel, Error> {
    return pipe(
      Effect.tryPromise(() =>
        this.prisma.outboxEvent.update({
          where: { aggregateId_eventType: { aggregateId, eventType } },
          data,
        }),
      ),
      Effect.map(OutboxEventModel.from),
    );
  }

  delete(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<void, Error> {
    const prisma = transaction ?? this.prisma;
    return Effect.tryPromise(() =>
      prisma.outboxEvent.delete({ where: { id } }),
    );
  }

  findOneBy(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OutboxEventModel | null, Error> {
    const prisma = transaction ?? this.prisma;
    return pipe(
      Effect.tryPromise(() => prisma.outboxEvent.findUnique({ where: { id } })),
      Effect.map((outboxEvent) =>
        outboxEvent ? OutboxEventModel.from(outboxEvent) : null,
      ),
    );
  }

  findAll(): Effect.Effect<OutboxEventModel[], Error> {
    return pipe(
      Effect.tryPromise(() => this.prisma.outboxEvent.findMany()),
      Effect.map((outboxEvents) => outboxEvents.map(OutboxEventModel.from)),
    );
  }

  getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OutboxEventModel, Error> {
    const prisma = transaction ?? this.prisma;
    return pipe(
      Effect.tryPromise(() =>
        prisma.outboxEvent.findUniqueOrThrow({ where: { id } }),
      ),
      Effect.map(OutboxEventModel.from),
    );
  }

  findByAggregateId(aggregateId: string, eventType: string) {
    return pipe(
      Effect.tryPromise(() =>
        this.prisma.outboxEvent.findUnique({
          where: {
            aggregateId_eventType: {
              aggregateId,
              eventType,
            },
          },
        }),
      ),
      Effect.map((outboxEvent) =>
        outboxEvent ? OutboxEventModel.from(outboxEvent) : null,
      ),
    );
  }
}
