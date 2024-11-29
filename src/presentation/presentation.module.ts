import { Module } from '@nestjs/common';
import { ApplicationModule } from 'src/application/application.module';
import { LoggerModule } from 'src/common/logger';
import {
  EventConsumerModule,
  ProductEventConsumer,
  UserEventConsumer,
} from './consumer';
import {
  AppController,
  OrderController,
  ProductController,
  UserController,
} from './controllers';

@Module({
  imports: [ApplicationModule, LoggerModule, EventConsumerModule],
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
