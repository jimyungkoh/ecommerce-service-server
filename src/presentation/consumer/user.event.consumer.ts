import {
  Controller,
  Inject,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { UserFacade } from 'src/application/facades';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import { OutboxEventTypes } from '../../domain/models/outbox-event.model';
import { KafkaClientKey } from '../../common/kafka/kafka.module';

@Controller()
export class UserEventConsumer implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(KafkaClientKey)
    private readonly kafkaClient: ClientKafka,
    private readonly userFacade: UserFacade,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  async onModuleDestroy() {
    await this.kafkaClient.close();
  }

  async onModuleInit() {
    await this.kafkaClient.connect();
    this.kafkaClient.subscribeToResponseOf(OutboxEventTypes.ORDER_CREATED);
  }

  @EventPattern(OutboxEventTypes.ORDER_CREATED)
  handleOrderCreated(@Payload() data: string) {
    // const orderInfo = JSON.parse(data);
    // this.logger.info(`요청 들어옴 ${JSON.stringify(orderInfo)}`);
    //
    // const { userId } = orderInfo.order;
    // const totalAmount = orderInfo.order.totalAmount();
    // const aggregateId = `order_${orderInfo.order.id}`;
    //
    // return this.userFacade.processOrderPayment(
    //   userId,
    //   totalAmount,
    //   aggregateId,
    // );
  }
}
