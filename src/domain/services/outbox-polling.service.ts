import { Inject, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { Domain } from 'src/common/decorators';
import { ErrorCodes } from 'src/common/errors';
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
import { OrderStatus, ProductStockModel } from '../models';
import {
  OutboxEventModel,
  OutboxEventStatus,
  OutboxEventTypes,
} from '../models/outbox-event.model';
import { CreateOrderInfo } from '../dtos';

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

  onModuleInit() {
    setInterval(() => pipe(this.pollEvents(), Effect.runPromise), 5_000);
  }

  private pollEvents() {
    return pipe(
      Effect.all([this.handleInitEvents(), this.handleFailedEvents()]),
    );
  }

  private handleInitEvents() {
    return pipe(
      this.outboxEventRepository.findEventsByStatus(OutboxEventStatus.INIT),
      Effect.flatMap((events) =>
        Effect.forEach(events, (event) =>
          pipe(
            this.processOutboxEvent(event),
            Effect.retry({
              times: 3,
              delay: 1_000,
            }),
            Effect.catchAll(() => this.handleFailedEvent(event)),
          ),
        ),
      ),
    );
  }

  private handleFailedEvents() {
    return pipe(
      this.outboxEventRepository.findEventsByStatus(OutboxEventStatus.FAIL),
      Effect.flatMap((events) =>
        Effect.forEach(events, (event) =>
          pipe(
            this.executeCompensation(event),
            Effect.retry({
              times: 3,
              delay: 1_000,
            }),
          ),
        ),
      ),
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
        return Effect.fail(err);
      }),
    );
  }

  private executeCompensation(event: OutboxEventModel) {
    const rawPayload = JSON.parse(event.payload);
    const payload: CreateOrderInfo =
      typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;

    this.logger.info(
      `원복 로직 실행 \n rawPayload: ${JSON.stringify(payload)}\n payload: ${JSON.stringify(payload)}`,
    );

    const findStocksWithXLock = (transaction: Prisma.TransactionClient) =>
      this.productStockRepository.findByIdsWithXLock(
        payload.orderItems.map((item) => item.productId),
        transaction,
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
      Effect.sync(() => {
        if (event.eventType === OutboxEventTypes.ORDER_PAYMENT) {
          // 재고 원복
          return pipe(
            this.prismaService.transaction(
              (tx) =>
                pipe(
                  findStocksWithXLock(tx),
                  Effect.tap((stocks) =>
                    this.logger.info(JSON.stringify(stocks)),
                  ),
                  Effect.flatMap(addStocks),
                  Effect.flatMap((stocks) =>
                    this.productStockRepository.updateBulk(stocks, tx),
                  ),
                ),
              ErrorCodes.ORDER_FAILED.message,
            ),
            Effect.tap((ret) => this.logger.info(`원복 결과: ${ret}`)),
            Effect.tapError((e) =>
              Effect.sync(() => this.logger.error(`원복 실패: ${e}`)),
            ),
            Effect.flatMap(() =>
              this.orderRepository.update(payload.order.id, {
                status: OrderStatus.FAILED,
              }),
            ),
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
