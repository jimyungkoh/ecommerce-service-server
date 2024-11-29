import { Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { Infrastructure } from 'src/common/decorators';
import {
  OutboxEventModel,
  OutboxEventStatus,
} from 'src/domain/models/outbox-event.model';
import { AppLogger, TransientLoggerServiceToken } from '../../../common/logger';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Infrastructure()
export class OutboxEventRepository
  implements BaseRepository<OutboxEventModel, OutboxEventModel>
{
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  create(
    outboxEvent: Prisma.OutboxEventCreateInput,
  ): Effect.Effect<OutboxEventModel, Error> {
    return pipe(
      Effect.tryPromise(() =>
        this.prismaService.outboxEvent.create({ data: outboxEvent }),
      ),
      Effect.map(OutboxEventModel.from),
    );
  }

  update(
    id: number,
    data: Prisma.OutboxEventUpdateInput,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OutboxEventModel, Error> {
    const prisma = transaction ?? this.prismaService;
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
        this.prismaService.outboxEvent.update({
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
    const prisma = transaction ?? this.prismaService;
    return Effect.tryPromise(() =>
      prisma.outboxEvent.delete({ where: { id } }),
    );
  }

  findOneBy(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OutboxEventModel | null, Error> {
    const prisma = transaction ?? this.prismaService;
    return pipe(
      Effect.tryPromise(() => prisma.outboxEvent.findUnique({ where: { id } })),
      Effect.map((outboxEvent) =>
        outboxEvent ? OutboxEventModel.from(outboxEvent) : null,
      ),
    );
  }

  findAll(): Effect.Effect<OutboxEventModel[], Error> {
    return pipe(
      Effect.tryPromise(() => this.prismaService.outboxEvent.findMany()),
      Effect.map((outboxEvents) => outboxEvents.map(OutboxEventModel.from)),
    );
  }

  getById(
    id: number,
    transaction?: Prisma.TransactionClient,
  ): Effect.Effect<OutboxEventModel, Error> {
    const prisma = transaction ?? this.prismaService;
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
        this.prismaService.outboxEvent.findUnique({
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

  findEventsByStatus(status: OutboxEventStatus) {
    return pipe(
      Effect.tryPromise(() =>
        this.prismaService.outboxEvent.findMany({
          where: {
            status,
          },
        }),
      ),
      Effect.map((outboxEvents) => outboxEvents.map(OutboxEventModel.from)),
    );
  }
}
