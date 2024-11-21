import { Module } from '@nestjs/common';
import { ApplicationModule } from 'src/application/application.module';
import { LoggerModule } from 'src/common/logger';
import {
  AppController,
  OrderController,
  ProductController,
  UserController,
} from './controllers';
import { OrderEventConsumer } from './consumer';
import { KafkaModule } from '../common/kafka/kafka.module';

@Module({
  imports: [KafkaModule, ApplicationModule, LoggerModule],
  controllers: [
    AppController,
    OrderController,
    ProductController,
    UserController,
  ],
  providers: [OrderEventConsumer],
})
export class PresentationModule {}
