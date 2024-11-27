import { Module } from '@nestjs/common';
import { ApplicationModule } from 'src/application/application.module';
import { LoggerModule } from 'src/common/logger';
import { ProductEventConsumer, UserEventConsumer } from './consumer';
import {
  AppController,
  OrderController,
  ProductController,
  UserController,
} from './controllers';
import { EventConsumerModule } from './consumer/event.consumer.module';
import { KafkaModule } from '../common/kafka/kafka.module';

@Module({
  imports: [KafkaModule, ApplicationModule, LoggerModule, EventConsumerModule],
  controllers: [
    ProductEventConsumer,
    UserEventConsumer,
    AppController,
    OrderController,
    ProductController,
    UserController,
  ],
})
export class PresentationModule {}
