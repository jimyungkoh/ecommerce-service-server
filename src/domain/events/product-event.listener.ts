import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { Domain } from 'src/common/decorators';
import { ErrorCodes } from 'src/common/errors';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import {
  ProductRepository,
  ProductStockRepository,
} from 'src/infrastructure/database/repositories';
import { OutboxEventRepository } from 'src/infrastructure/database/repositories/outbox-event.repository';
import { CreateOrderInfo, OutboxEventInfo } from '../dtos';
import { ProductStockModel } from '../models';
import {
  OutboxEventStatus,
  OutboxEventTypes,
} from '../models/outbox-event.model';

@Domain()
export class ProductEventListener {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productStockRepository: ProductStockRepository,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly prismaService: PrismaService,
  ) {}

  @OnEvent(OutboxEventTypes.ORDER_DEDUCT_STOCK)
  handleOrderDeductStock(payload: {
    info: CreateOrderInfo;
    outboxEvent: OutboxEventInfo;
  }) {
    const outboxEvent = this.outboxEventRepository.findByAggregateId(
      payload.outboxEvent.aggregateId,
      OutboxEventTypes.ORDER_DEDUCT_STOCK,
    );

    const findStocksWithXLock = (transaction: Prisma.TransactionClient) =>
      this.productStockRepository.findByIdsWithXLock(
        Object.keys(payload.info.orderItems).map(Number),
        transaction,
      );

    const deductStocks = (productStocks: ProductStockModel[]) =>
      Effect.all(
        productStocks.map((stock) =>
          stock.deduct(payload.info.orderItems[stock.productId].quantity),
        ),
      );

    const updateStocks = (
      updates: ProductStockModel[],
      transaction: Prisma.TransactionClient,
    ) => this.productStockRepository.updateBulk(updates, transaction);

    const createOutboxEvent = (transaction: Prisma.TransactionClient) =>
      this.outboxEventRepository.create(
        {
          aggregateId: payload.outboxEvent.aggregateId,
          eventType: OutboxEventTypes.ORDER_DEDUCT_STOCK,
          payload: JSON.stringify(payload.info.orderItems),
        },
        transaction,
      );

    return pipe(
      outboxEvent,
      Effect.flatMap((outboxEvent) =>
        outboxEvent?.status !== OutboxEventStatus.INIT
          ? Effect.succeed(void 0)
          : this.prismaService.transaction(
              (transaction) =>
                pipe(
                  findStocksWithXLock(transaction),
                  Effect.flatMap(deductStocks),
                  Effect.flatMap((updates) =>
                    updateStocks(updates, transaction),
                  ),
                  Effect.tap(() => createOutboxEvent(transaction)),
                  Effect.catchAll((e) => Effect.fail(e)),
                ),
              ErrorCodes.DEDUCT_STOCK_FAILED.message,
            ),
      ),
      Effect.tap(() =>
        this.outboxEventRepository.updateByAggregateIdAndEventType(
          payload.outboxEvent.aggregateId,
          OutboxEventTypes.ORDER_DEDUCT_STOCK,
          { status: OutboxEventStatus.SUCCESS },
        ),
      ),
      Effect.catchAll(() =>
        this.outboxEventRepository.updateByAggregateIdAndEventType(
          payload.outboxEvent.aggregateId,
          OutboxEventTypes.ORDER_DEDUCT_STOCK,
          { status: OutboxEventStatus.FAIL },
        ),
      ),
    );
  }
}
