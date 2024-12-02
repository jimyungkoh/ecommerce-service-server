import { Module } from '@nestjs/common';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { OrderEventListener } from './order-event.listener';
import { ProductEventListener } from './product-event.listener';
import { UserEventListener } from './user-event.listener';

@Module({
  imports: [InfrastructureModule],
  providers: [OrderEventListener, ProductEventListener, UserEventListener],
})
export class EventsModule {}
