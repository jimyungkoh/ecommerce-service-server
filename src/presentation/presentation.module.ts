import { Module } from '@nestjs/common';
import { ApplicationModule } from 'src/application/application.module';
import { LoggerModule } from 'src/common/logger';
import { KafkaModule } from '../common/kafka/kafka.module';
import { ProductEventConsumer, UserEventConsumer } from './consumer';
import {
  AppController,
  OrderController,
  ProductController,
  UserController,
} from './controllers';

@Module({
  imports: [KafkaModule, ApplicationModule, LoggerModule],
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
