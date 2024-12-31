import { Inject, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Effect, pipe, Schedule } from 'effect';
import { Domain } from 'src/common/decorators';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import {
  OrderRepository,
  ProductStockRepository,
} from 'src/infrastructure/database';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { OutboxEventRepository } from 'src/infrastructure/database/repositories/outbox-event.repository';
import {
  OrderEventProducer,
  ProductProducer,
  UserProducer,
} from 'src/infrastructure/producer';
import { CreateOrderInfo } from '../dtos';
import { AppConflictException } from '../exceptions';
import {
  OrderStatus,
  OutboxEventModel,
  OutboxEventStatus,
  OutboxEventTypes,
  ProductStockModel,
} from '../models';

@Domain()
export class OutboxPollingService implements OnModuleInit {
  constructor(
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly orderProducer: OrderEventProducer,
    private readonly productProducer: ProductProducer,
    private readonly userProducer: UserProducer,
    private readonly prismaService: PrismaService,
    private readonly orderRepository: OrderRepository,
    private readonly productStockRepository: ProductStockRepository,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  deductStockFailCount = 0;

  onModuleInit() {
    Effect.runFork(
      Effect.repeat(Effect.forever(this.pollEvents()), {
        // 30초마다
        schedule: Schedule.spaced(10_000),
      }),
    );
  }

  private pollEvents(): Effect.Effect<unknown, never, never> {
    return Effect.all([this.handleInitEvents(), this.handleFailedEvents()]);
  }

  private createEventHandler<T>(
    processEvent: (event: OutboxEventModel) => Effect.Effect<T, Error, never>,
  ) {
    return (event: OutboxEventModel) =>
      pipe(
        processEvent(event),
        Effect.retry({
          times: 3,
          delay: 1_000,
        }),
        Effect.catchAll(() => this.handleFailedEvent(event)),
      );
  }

  private handleEvents(
    status: OutboxEventStatus,
    processEvent: (
      event: OutboxEventModel,
    ) => Effect.Effect<unknown, Error, never>,
  ) {
    const handleEventWithRetry = this.createEventHandler(processEvent);

    return pipe(
      this.outboxEventRepository.findEventsByStatus(status),
      Effect.flatMap((events) =>
        Effect.forEach(events, handleEventWithRetry, {
          concurrency: 5,
          batching: true,
        }),
      ),
      Effect.catchAll(() => Effect.succeed(void 0)),
    );
  }

  private handleInitEvents() {
    return this.handleEvents(
      OutboxEventStatus.INIT,
      this.processOutboxEvent.bind(this),
    );
  }

  private handleFailedEvents() {
    this.logger.info('실패 이벤트 처리 시작');
    return this.handleEvents(
      OutboxEventStatus.FAIL,
      this.executeCompensation.bind(this),
    ).pipe(
      Effect.tap((ret) => {
        if (typeof ret === 'object' && ret.length > 0) {
          this.deductStockFailCount += ret.length;
          this.logger.info(`재고 차감 실패 횟수: ${this.deductStockFailCount}`);
        }
      }),
    );
  }

  private processOutboxEvent(event: OutboxEventModel) {
    // event.payload가 이미 문자열화된 JSON이므로 한번만 파싱
    const payload = event.payload.startsWith('"')
      ? JSON.parse(JSON.parse(event.payload)) // 이중 파싱
      : JSON.parse(event.payload); // 단일 파싱

    const produceEvent = () => {
      switch (event.eventType) {
        case OutboxEventTypes.ORDER_CREATED:
          return this.orderProducer.produceOrderCreatedEvent(
            payload.order.id,
            event,
          );
        case OutboxEventTypes.ORDER_DEDUCT_STOCK:
          return this.productProducer.produceOrderDeductStockEvent(
            payload.order.id,
            event,
          );
        case OutboxEventTypes.ORDER_PAYMENT:
          return this.userProducer.produceOrderSuccessEvent(
            payload.order.id,
            event,
          );
        case OutboxEventTypes.ORDER_SUCCESS:
          return Effect.succeed(void 0);
        default:
          throw new Error(`Unknown event type: ${event.eventType}`);
      }
    };

    return pipe(
      produceEvent(),
      Effect.tap(() =>
        pipe(
          this.outboxEventRepository.updateByAggregateIdAndEventType(
            event.aggregateId,
            event.eventType,
            {
              status: OutboxEventStatus.SUCCESS,
            },
          ),
        ),
      ),
      Effect.catchAll((err) => {
        this.logger.error(
          `아웃박스 이벤트 처리 중 에러 발생 ${err}; ${event.eventType}`,
        );
        return Effect.succeed(err);
      }),
    );
  }

  private executeCompensation(event: OutboxEventModel) {
    const rawPayload = JSON.parse(event.payload);
    const payload: CreateOrderInfo =
      typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;

    const findStocks = (tx: Prisma.TransactionClient) =>
      this.productStockRepository.findByIdsWithXLock(
        payload.orderItems.map((item) => item.productId),
        tx,
      );

    const addStocks = (productStocks: ProductStockModel[]) =>
      Effect.all(
        productStocks.map((stock) => {
          const orderItem = payload.orderItems.find(
            (item) => item.productId === stock.productId,
          );
          if (!orderItem) {
            return Effect.fail(
              new Error(
                `OrderItem not found for productId: ${stock.productId}`,
              ),
            );
          }
          return stock.add(orderItem.quantity);
        }),
      );

    return pipe(
      Effect.tryPromise(() => {
        if (event.eventType === OutboxEventTypes.ORDER_PAYMENT) {
          // 재고 원복
          return pipe(
            this.prismaService.transaction((tx) =>
              pipe(
                findStocks(tx),
                Effect.flatMap(addStocks),
                Effect.flatMap((stocks) =>
                  this.productStockRepository.updateBulk(stocks, tx),
                ),
              ),
            ),
            Effect.catchAll((ret) => {
              return ret instanceof AppConflictException
                ? Effect.succeed(void 0)
                : this.orderRepository.update(payload.order.id, {
                    status: OrderStatus.FAILED,
                  });
            }),
            Effect.runPromise,
          );
        } else {
          return pipe(
            this.orderRepository.update(payload.order.id, {
              status: OrderStatus.FAILED,
            }),
            Effect.runPromise,
          );
        }
      }),
      Effect.flatMap((result) =>
        pipe(
          this.outboxEventRepository.updateByAggregateIdAndEventType(
            event.aggregateId,
            event.eventType,
            {
              status: OutboxEventStatus.SUCCESS,
            },
          ),
          Effect.map(() => result),
        ),
      ),
    );
  }

  private handleFailedEvent(event: OutboxEventModel) {
    return this.outboxEventRepository.updateByAggregateIdAndEventType(
      event.aggregateId,
      event.eventType,
      { status: OutboxEventStatus.FAIL },
    );
  }
}
