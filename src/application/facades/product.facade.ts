import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { CreateOrderInfo, DeductStockCommand } from 'src/domain/dtos';
import { ProductService } from 'src/domain/services';
import { Application } from '../../common/decorators';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';
import { OutboxEventTypes } from '../../domain/models/outbox-event.model';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEventRepository } from '../../infrastructure/database/repositories/outbox-event.repository';
import { GetProductResult } from '../dtos/results/product/get-product.result';
import { ApplicationException } from '../../domain/exceptions';

@Application()
export class ProductFacade {
  constructor(
    private readonly productService: ProductService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prismaService: PrismaService,
    private readonly outboxRepository: OutboxEventRepository,
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

    const emitStockDeductedEvent = (phase: 'before_commit' | 'after_commit') =>
      Effect.tryPromise(async () => {
        await this.eventEmitter.emitAsync(
          `${OutboxEventTypes.ORDER_DEDUCT_STOCK}.${phase}`,
          orderInfo,
        );
      });

    const emitStockDeductedFailedEvent = () =>
      pipe(
        Effect.tryPromise(async () => {
          await this.eventEmitter.emitAsync(
            `${OutboxEventTypes.ORDER_DEDUCT_STOCK}.failed`,
            orderInfo,
          );
        }),
        Effect.runPromise,
      );

    return pipe(
      this.prismaService.transaction((tx) =>
        pipe(
          // 2. 재고 차감
          deductStock(tx),
          // before_commit: 아웃박스 - 주문 - 재고 차감 저장
          Effect.tap(() => emitStockDeductedEvent('before_commit')),
        ),
      ),
      Effect.flatMap((ret) =>
        ret instanceof ApplicationException
          ? Effect.fail(ret)
          : Effect.succeed(ret),
      ),
      Effect.runPromise,
    ).catch(emitStockDeductedFailedEvent);
  }
}
