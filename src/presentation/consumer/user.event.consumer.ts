import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserFacade } from 'src/application/facades';
import { CreateOrderInfo } from 'src/domain/dtos';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';
import { OutboxEventTypes } from '../../domain/models/outbox-event.model';

@Controller()
export class UserEventConsumer /*implements OnModuleInit, OnModuleDestroy */ {
  constructor(
    private readonly userFacade: UserFacade,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  private processedMessages = new Set<number>();

  @MessagePattern(OutboxEventTypes.ORDER_DEDUCT_STOCK)
  async handleDeductStock(@Payload() payload: string) {
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
    await this.userFacade.processOrderPayment(orderInfo);
  }
}
