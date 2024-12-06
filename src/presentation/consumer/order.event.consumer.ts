import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Effect } from 'effect';
import { OrderFacade } from 'src/application/facades';
import { CreateOrderInfo } from '../../domain/dtos';
import { OutboxEventTypes } from '../../domain/models/outbox-event.model';
import { ConsumerInterceptor } from '../interceptors/consumer.interceptor';

@Controller()
@UseInterceptors(ConsumerInterceptor)
export class OrderEventConsumer {
  constructor(private readonly orderFacade: OrderFacade) {}

  private processedMessages = new Set<number>();

  @MessagePattern(OutboxEventTypes.ORDER_PAYMENT)
  async handleOrderCreated(@Payload() payload: string) {
    const orderInfo =
      typeof payload === 'string'
        ? typeof payload === 'string' && payload.startsWith('{')
          ? (JSON.parse(payload) as CreateOrderInfo)
          : (JSON.parse(JSON.parse(payload)) as CreateOrderInfo)
        : (payload as CreateOrderInfo);

    const messageId = orderInfo.order.id;

    // 이미 처리된 메시지인지 확인
    if (this.processedMessages.has(messageId)) return;

    this.processedMessages.add(messageId);

    await Effect.runPromise(this.orderFacade.processOrderSuccess(orderInfo));
  }
}
