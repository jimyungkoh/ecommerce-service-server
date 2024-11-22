import { OrderInfo } from '../../../info';

export class CreateOrderOutboxEventCommand {
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: string;

  constructor({
    aggregateId,
    eventType,
    payload,
  }: {
    aggregateId: string;
    eventType: string;
    payload: string;
  }) {
    this.aggregateId = aggregateId;
    this.eventType = eventType;
    this.payload = payload;
  }

  static from(order: OrderInfo) {
    return new CreateOrderOutboxEventCommand({
      aggregateId: `order-${order.id}`,
      eventType: 'order.created',
      payload: JSON.stringify(order),
    });
  }
}
