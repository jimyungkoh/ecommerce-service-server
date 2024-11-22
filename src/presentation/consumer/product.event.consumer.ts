import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ProductFacade } from 'src/application/facades';
import { CreateOrderInfo } from 'src/domain/dtos';
import { OutboxEventTypes } from 'src/domain/models/outbox-event.model';

@Controller()
export class ProductEventConsumer {
  constructor(private readonly productFacade: ProductFacade) {}

  @EventPattern(OutboxEventTypes.ORDER_CREATED)
  handleOrderCreated(@Payload() data: CreateOrderInfo) {
    return this.productFacade.processOrderDeductStock({
      info: data,
      aggregateId: `order_${data.order.id}`,
    });
  }
}
