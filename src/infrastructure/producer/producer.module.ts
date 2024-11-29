import { Module } from '@nestjs/common';
import { OrderEventProducer } from './order.event.producer';
import { UserProducer } from './user.producer';
import { ProductProducer } from './product.producer';

// import { KafkaModule } from '../../common/kafka/kafka.module';

@Module({
  imports: [],
  providers: [OrderEventProducer, UserProducer, ProductProducer],
  exports: [OrderEventProducer, UserProducer, ProductProducer],
})
export class ProducerModule {}
