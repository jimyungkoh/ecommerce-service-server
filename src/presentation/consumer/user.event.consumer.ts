import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UserFacade } from 'src/application/facades';
import { CreateOrderInfo } from 'src/domain/dtos';
import { OutboxEventTypes } from 'src/domain/models/outbox-event.model';

@Controller()
export class UserEventConsumer {
  constructor(private readonly userFacade: UserFacade) {}

  @EventPattern(OutboxEventTypes.ORDER_CREATED)
  handleOrderCreated(@Payload() data: CreateOrderInfo) {
    const { userId } = data.order;
    const totalAmount = data.totalAmount();
    const aggregateId = `order_${data.order.id}`;

    return this.userFacade.processOrderPayment(
      userId,
      totalAmount,
      aggregateId,
    );
  }
}
