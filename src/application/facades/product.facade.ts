import { Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import {
  CreateOrderInfo,
  CreateOutboxEventCommand,
  DeductStockCommand,
} from 'src/domain/dtos';
import { ApplicationException } from 'src/domain/exceptions';
import { ProductService } from 'src/domain/services';
import { OutboxEventService } from 'src/domain/services/outbox-event.service';
import { Application } from '../../common/decorators';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';
import {
  OutboxEventStatus,
  OutboxEventTypes,
} from '../../domain/models/outbox-event.model';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { GetProductResult } from '../dtos/results/product/get-product.result';
@Application()
export class ProductFacade {
  constructor(
    private readonly productService: ProductService,
    private readonly prismaService: PrismaService,
    private readonly outboxEventService: OutboxEventService,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  getProductById(id: number) {
    return pipe(
      Effect.all([
        this.productService.getBy(id),
        this.productService.getStockBy(id),
      ]),
      Effect.map(([productInfo, productStockInfo]) =>
        GetProductResult.from(productInfo, productStockInfo),
      ),
    );
  }

  getPopularProducts(date: Date) {
    return this.productService.getPopularProducts(date);
  }

  processOrderDeductStock(orderInfo: CreateOrderInfo) {
    const deductStock = (tx: Prisma.TransactionClient) =>
      this.productService.deductStock(
        new DeductStockCommand({
          orderItems: Object.fromEntries(
            orderInfo.orderItems.map((item) => [item.productId, item.quantity]),
          ),
        }),
        tx,
      );

    const emitStockDeductedEvent = (
      tx?: Prisma.TransactionClient,
      status: OutboxEventStatus = OutboxEventStatus.INIT,
    ) => {
      const command = new CreateOutboxEventCommand({
        aggregateId: `order-${orderInfo.order.id}`,
        eventType: OutboxEventTypes.ORDER_DEDUCT_STOCK,
        payload: JSON.stringify(orderInfo),
        status,
      });

      return tx
        ? this.outboxEventService.createOutboxEvent(command, tx)
        : this.outboxEventService.createOutboxEvent(command);
    };

    const setOrderCreatedEventToInit = () => {
      return pipe(
        this.outboxEventService.findByAggregate(
          `order-${orderInfo.order.id}`,
          OutboxEventTypes.ORDER_CREATED,
        ),
        Effect.flatMap((outboxEvent) => {
          return outboxEvent
            ? this.outboxEventService.updateOutboxEvent(
                outboxEvent.aggregateId,
                OutboxEventTypes.ORDER_CREATED,
                { status: OutboxEventStatus.INIT },
              )
            : Effect.succeed(null);
        }),
      );
    };

    return pipe(
      this.prismaService.transaction(
        (tx) =>
          pipe(
            deductStock(tx),
            Effect.tap(() => emitStockDeductedEvent(tx)),
          ),
        {
          maxWait: 5_000,
          timeout: 3_000,
        },
      ),
      Effect.catchAll((error) => {
        if (error instanceof Error) this.logger.error(JSON.stringify(error));

        return error instanceof ApplicationException &&
          error.message === ErrorCodes.PRODUCT_OUT_OF_STOCK.message
          ? emitStockDeductedEvent(undefined, OutboxEventStatus.FAIL)
          : setOrderCreatedEventToInit();
      }),
    );
  }
}
