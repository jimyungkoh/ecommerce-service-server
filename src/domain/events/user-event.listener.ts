import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { Domain } from 'src/common/decorators';
import { ErrorCodes } from 'src/common/errors';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import {
  PointRepository,
  WalletRepository,
} from 'src/infrastructure/database/repositories';
import { OutboxEventRepository } from 'src/infrastructure/database/repositories/outbox-event.repository';
import { CreatePointParam } from 'src/infrastructure/dto';
import { UserProducer } from 'src/infrastructure/producer/user.producer';
import { CreateOrderInfo, OutboxEventInfo } from '../dtos';
import { TransactionType, WalletModel } from '../models';
import {
  OutboxEventStatus,
  OutboxEventTypes,
} from '../models/outbox-event.model';

@Domain()
export class UserEventListener {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly pointRepository: PointRepository,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly prismaService: PrismaService,
    private readonly userProducer: UserProducer,
  ) {}

  @OnEvent(OutboxEventTypes.ORDER_PAYMENT)
  handleOrderPayment(payload: {
    info: CreateOrderInfo;
    outboxEvent: OutboxEventInfo;
  }) {
    const findOutboxEvent = this.outboxEventRepository.findByAggregateId(
      payload.outboxEvent.aggregateId,
      OutboxEventTypes.ORDER_PAYMENT,
    );

    const payWithWallet = pipe(
      this.walletRepository.getByUserId(payload.info.order.userId),
      Effect.map((wallet) => wallet.use(payload.info.totalAmount())),
    );

    const processPayment = (
      wallet: WalletModel,
      transaction: Prisma.TransactionClient,
    ) =>
      Effect.gen(this, function* ($) {
        const totalAmount = payload.info.totalAmount();

        yield* $(
          this.pointRepository.create(
            new CreatePointParam({
              walletId: wallet.id,
              amount: totalAmount,
              transactionType: TransactionType.USE,
            }),
            transaction,
          ),
        );

        const updatedWallet = yield* $(
          this.walletRepository.update(
            wallet.id,
            {
              totalPoint: wallet.totalPoint,
            },
            wallet.version,
            transaction,
          ),
        );

        yield* $(
          this.outboxEventRepository.create(
            {
              aggregateId: payload.outboxEvent.aggregateId,
              eventType: OutboxEventTypes.ORDER_PAYMENT,
              payload: JSON.stringify(updatedWallet),
            },
            transaction,
          ),
        );
      });

    pipe(
      findOutboxEvent,
      Effect.flatMap((event) =>
        !event || event.status !== OutboxEventStatus.INIT
          ? Effect.succeed(undefined)
          : pipe(
              payWithWallet,
              Effect.flatMap((wallet) =>
                this.prismaService.transaction(
                  (transaction) => processPayment(wallet, transaction),
                  ErrorCodes.ORDER_FAILED.message,
                ),
              ),
            ),
      ),
      Effect.tap(() =>
        Effect.all([
          this.outboxEventRepository.updateByAggregateIdAndEventType(
            payload.outboxEvent.aggregateId,
            OutboxEventTypes.ORDER_PAYMENT,
            { status: OutboxEventStatus.SUCCESS },
          ),
          this.userProducer.produceOrderSuccessEvent(payload.info),
        ]),
      ),
      Effect.catchAll(() =>
        Effect.all([
          this.outboxEventRepository.updateByAggregateIdAndEventType(
            payload.outboxEvent.aggregateId,
            OutboxEventTypes.ORDER_PAYMENT,
            { status: OutboxEventStatus.FAIL },
          ),
          this.userProducer.produceOrderFailedEvent(
            payload.outboxEvent.aggregateId,
          ),
        ]),
      ),
    );
  }
}
