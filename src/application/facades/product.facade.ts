import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateOrderInfo } from 'src/domain/dtos';
import { OutboxEventTypes } from 'src/domain/models/outbox-event.model';
import { ProductService } from 'src/domain/services';
import { Application } from '../../common/decorators';

@Application()
export class ProductFacade {
  constructor(
    private readonly productService: ProductService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getProductById(id: number) {
    return this.productService.getBy(id);
  }

  getPopularProducts(date: Date) {
    return this.productService.getPopularProducts(date);
  }

  processOrderDeductStock(payload: {
    info: CreateOrderInfo;
    aggregateId: string;
  }) {
    this.eventEmitter.emit(OutboxEventTypes.ORDER_DEDUCT_STOCK, {
      info: payload.info,
      outboxEvent: {
        aggregateId: payload.aggregateId,
        eventType: OutboxEventTypes.ORDER_DEDUCT_STOCK,
        payload: JSON.stringify(payload.info),
      },
    });
  }
}
