import { Module } from '@nestjs/common';
import { KafkaModule } from '../../common/kafka/kafka.module';
import { OrderEventProducer } from './order.event.producer';
import { UserProducer } from './user.producer';
import { ProductProducer } from './product.producer';

@Module({
  imports: [KafkaModule],
  providers: [OrderEventProducer, UserProducer, ProductProducer],
  exports: [OrderEventProducer, UserProducer, ProductProducer],
})
export class ProducerModule {}
