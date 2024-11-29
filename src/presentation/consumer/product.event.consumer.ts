import { Controller, Inject } from '@nestjs/common';
import {
  Ctx,
  KafkaContext,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';
import { ProductFacade } from 'src/application/facades';
import { OutboxEventTypes } from 'src/domain/models/outbox-event.model';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';
import { CreateOrderInfo } from '../../domain/dtos';

@Controller()
export class ProductEventConsumer {
  constructor(
    private readonly productFacade: ProductFacade,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  private processedMessages = new Set<number>();

  @MessagePattern(OutboxEventTypes.ORDER_CREATED)
  async handleOrderCreated(
    @Payload() payload: string,
    @Ctx() context: KafkaContext,
  ) {
    console.log('호출');
    const orderInfo =
      typeof payload === 'string'
        ? typeof payload === 'string' && payload.startsWith('{')
          ? (JSON.parse(payload) as CreateOrderInfo)
          : (JSON.parse(JSON.parse(payload)) as CreateOrderInfo)
        : (payload as CreateOrderInfo);

    const messageId = orderInfo.order.id;

    // 이미 처리된 메시지인지 확인
    if (this.processedMessages.has(messageId)) {
      this.logger.debug(`Duplicate message detected: ${messageId}`);
      return;
    }

    this.processedMessages.add(messageId);
    await this.productFacade.processOrderDeductStock(orderInfo);
  }
}
