import { Module } from '@nestjs/common';
import { ProductEventConsumer } from './product.event.consumer';
import { UserEventConsumer } from './user.event.consumer';
import { ApplicationModule } from '../../application/application.module';
import { OrderEventConsumer } from './order.event.consumer';

@Module({
  imports: [ApplicationModule],
  controllers: [ProductEventConsumer, UserEventConsumer, OrderEventConsumer],
})
export class EventConsumerModule {}
