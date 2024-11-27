import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { ErrorCodes } from 'src/common/errors';
import { CreateOrderInfo, DeductStockCommand } from 'src/domain/dtos';
import { ProductService } from 'src/domain/services';
import { Application } from '../../common/decorators';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';
import { OutboxEventTypes } from '../../domain/models/outbox-event.model';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Application()
export class ProductFacade {
  constructor(
    private readonly productService: ProductService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prismaService: PrismaService,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  getProductById(id: number) {
    return this.productService.getBy(id);
  }

  getPopularProducts(date: Date) {
    return this.productService.getPopularProducts(date);
  }

  async processOrderDeductStock(orderInfo: CreateOrderInfo) {
    const deductStock = (tx: Prisma.TransactionClient) =>
      this.productService.deductStock(
        new DeductStockCommand({
          orderItems: Object.fromEntries(
            orderInfo.orderItems.map(({ productId, quantity }) => [
              productId,
              quantity,
            ]),
          ),
        }),
        tx,
      );

    const emitStockDeductedEvent = (phase: 'before_commit' | 'after_commit') =>
      Effect.tryPromise(
        async () =>
          await this.eventEmitter.emitAsync(
            `${OutboxEventTypes.ORDER_DEDUCT_STOCK}.${phase}`,
            orderInfo,
          ),
      );

    return pipe(
      this.prismaService.transaction(
        (tx) =>
          pipe(
            // 2. 재고 차감
            deductStock(tx),
            // before_commit: 아웃박스 - 주문 - 재고 차감 저장
            Effect.tap(() => emitStockDeductedEvent('before_commit')),
          ),
        ErrorCodes.PRODUCT_OUT_OF_STOCK.message,
      ),
      // after_commit: ProductProducer - order.deduct_stock 메시지 발행
      Effect.tap(() => emitStockDeductedEvent('after_commit')),
    );
  }
}
