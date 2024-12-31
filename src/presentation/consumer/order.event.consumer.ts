import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Effect, Fiber, pipe } from 'effect';
import { MurLockService } from 'murlock';
import { OrderFacade } from 'src/application/facades';
import { CreateOrderInfo } from '../../domain/dtos';
import { OutboxEventTypes } from '../../domain/models/outbox-event.model';
import { ConsumerInterceptor } from '../interceptors';

@Controller()
@UseInterceptors(ConsumerInterceptor)
export class OrderEventConsumer {
  constructor(
    private readonly orderFacade: OrderFacade,
    private readonly murLock: MurLockService,
  ) {}

  @MessagePattern(OutboxEventTypes.ORDER_PAYMENT)
  handleOrderPayment(@Payload() payload: string) {
    const orderInfo = Effect.sync(() =>
      typeof payload === 'string'
        ? typeof payload === 'string' && payload.startsWith('{')
          ? (JSON.parse(payload) as CreateOrderInfo)
          : (JSON.parse(JSON.parse(payload)) as CreateOrderInfo)
        : (payload as CreateOrderInfo),
    );

    return pipe(
      orderInfo,
      Effect.fork,
      Effect.flatMap((fiber) => Fiber.join(fiber)),
      Effect.flatMap((orderInfo) =>
        this.orderFacade.processOrderSuccess(orderInfo),
      ),
    );
  }
}
