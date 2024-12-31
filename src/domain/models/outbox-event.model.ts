import { OutboxEvent } from '@prisma/client';

export const OutboxEventStatus = {
  INIT: 'INIT',
  SUCCESS: 'SUCCESS',
  FAIL: 'FAIL',
} as const;

export type OutboxEventStatus =
  (typeof OutboxEventStatus)[keyof typeof OutboxEventStatus];

export const OutboxEventTypes = {
  ORDER_CREATED: 'order.created',
  ORDER_PAYMENT: 'order.payment',
  ORDER_DEDUCT_STOCK: 'order.deduct_stock',
  ORDER_SUCCESS: 'order.success',
  ORDER_FAILED: 'order.failed',
} as const;

export type OutboxEventType =
  (typeof OutboxEventTypes)[keyof typeof OutboxEventTypes];

export type OutboxEventModelProps = {
  aggregateId: string;
  eventType: OutboxEventType;
  payload: string;
  status: OutboxEventStatus;
};

export class OutboxEventModel {
  readonly aggregateId: string;
  readonly eventType: OutboxEventType;
  readonly payload: string;
  readonly status: OutboxEventStatus;

  constructor(props: OutboxEventModelProps) {
    this.aggregateId = props.aggregateId;
    this.eventType = props.eventType;
    this.payload = props.payload;
    this.status = props.status;
  }

  static from(props: OutboxEvent) {
    return new OutboxEventModel({
      aggregateId: props.aggregateId,
      eventType: props.eventType as OutboxEventType,
      payload: JSON.stringify(props.payload),
      status: props.status,
    });
  }
}
