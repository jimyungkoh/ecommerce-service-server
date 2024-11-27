import { OnEvent } from '@nestjs/event-emitter';
import { Effect, pipe } from 'effect';
import { Domain } from 'src/common/decorators';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import {
  PointRepository,
  WalletRepository,
} from 'src/infrastructure/database/repositories';
import { OutboxEventRepository } from 'src/infrastructure/database/repositories/outbox-event.repository';
import { UserProducer } from 'src/infrastructure/producer/user.producer';
import { CreateOrderInfo } from '../dtos';
import { OutboxEventTypes } from '../models/outbox-event.model';
import { BaseOutboxEventListener } from './base-outbox-event.listener';

@Domain()
export class UserEventListener extends BaseOutboxEventListener {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly pointRepository: PointRepository,
    private readonly prismaService: PrismaService,
    private readonly userProducer: UserProducer,
    protected readonly outboxEventRepository: OutboxEventRepository,
  ) {
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

  @OnEvent(`${OutboxEventTypes.ORDER_PAYMENT}.after_commit`, {
    async: true,
    promisify: true,
    suppressErrors: false,
  })
  publishOrderPaymentEvent(payload: CreateOrderInfo) {
    return pipe(
      this.userProducer.produceOrderSuccessEvent(payload),
      Effect.runPromise,
    );
  }
}
