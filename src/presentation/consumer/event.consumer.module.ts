import { Module } from '@nestjs/common';
import { ProductEventConsumer } from './product.event.consumer';
import { UserEventConsumer } from './user.event.consumer';
import { KafkaModule } from '../../common/kafka/kafka.module';
import { ApplicationModule } from '../../application/application.module';

@Module({
  imports: [KafkaModule, ApplicationModule],
  controllers: [ProductEventConsumer, UserEventConsumer],
})
export class EventConsumerModule {}
