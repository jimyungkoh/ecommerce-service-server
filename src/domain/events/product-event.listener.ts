import { Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Effect, pipe } from 'effect';
import { Domain } from 'src/common/decorators';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import {
  ProductRepository,
  ProductStockRepository,
} from 'src/infrastructure/database/repositories';
import { OutboxEventRepository } from 'src/infrastructure/database/repositories/outbox-event.repository';
import { ProductProducer } from 'src/infrastructure/producer';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';
import { CreateOrderInfo } from '../dtos';
import {
  OutboxEventStatus,
  OutboxEventTypes,
} from '../models/outbox-event.model';
import { BaseOutboxEventListener } from './base-outbox-event.listener';

@Domain()
export class ProductEventListener extends BaseOutboxEventListener {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productStockRepository: ProductStockRepository,
    private readonly prismaService: PrismaService,
    private readonly productProducer: ProductProducer,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    protected readonly outboxEventRepository: OutboxEventRepository,
  ) {
    super(outboxEventRepository);
  }

  @OnEvent(`${OutboxEventTypes.ORDER_DEDUCT_STOCK}.before_commit`, {
    async: true,
    promisify: true,
    suppressErrors: false,
  })
  async createOrderOutboxRecord(payload: CreateOrderInfo) {
    const aggregateId = `order-${payload.order.id}`;
    console.log('페이로드', payload);
    return await pipe(
      this.handleBeforeCommitEvent(
        aggregateId,
        payload,
        OutboxEventTypes.ORDER_DEDUCT_STOCK,
      ),
      Effect.runPromise,
    );
  }

  @OnEvent(`${OutboxEventTypes.ORDER_DEDUCT_STOCK}.after_commit`, {
    async: true,
    promisify: true,
    suppressErrors: false,
  })
  async publishOrderCreatedEvent(payload: CreateOrderInfo) {
    // return pipe(
    //   this.productProducer.produceOrderDeductStockEvent(payload),
    //   Effect.runPromise,
    // );
  }

  @OnEvent(`${OutboxEventTypes.ORDER_DEDUCT_STOCK}.failed`, {
    async: true,
    promisify: true,
    suppressErrors: false,
  })
  async publishOrderDeductStockFailedEvent(payload: CreateOrderInfo) {
    return pipe(
      this.outboxEventRepository.create({
        eventType: OutboxEventTypes.ORDER_DEDUCT_STOCK,
        aggregateId: `order-${payload.order.id}`,
        payload: JSON.stringify(payload),
        status: OutboxEventStatus.FAIL,
      }),
      Effect.tap(() => this.logger.info('아웃박스 이벤트 실패')),
      Effect.runPromise,
    );
  }
}
