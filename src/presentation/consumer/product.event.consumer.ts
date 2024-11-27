import {
  Controller,
  Inject,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import { ProductFacade } from 'src/application/facades';
import { OutboxEventTypes } from 'src/domain/models/outbox-event.model';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';
import { CreateOrderInfo } from '../../domain/dtos';
import { KafkaClientKey } from '../../common/kafka/kafka.module';

@Controller()
export class ProductEventConsumer implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(KafkaClientKey)
    private readonly kafkaClient: ClientKafka,
    private readonly productFacade: ProductFacade,
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
  handleOrderCreated(@Payload() orderInfo: CreateOrderInfo) {
    return this.productFacade.processOrderDeductStock(orderInfo);
  }
}
