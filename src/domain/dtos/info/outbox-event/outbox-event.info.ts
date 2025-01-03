import {
  OutboxEventModel,
  OutboxEventStatus,
} from 'src/domain/models/outbox-event.model';

export type OutboxEventInfoProps = {
  aggregateId: string;
  eventType: string;
  payload: string;
  status: OutboxEventStatus;
};

export class OutboxEventInfo {
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: string;
  readonly status: OutboxEventStatus;
  constructor(props: OutboxEventInfoProps) {
    this.aggregateId = props.aggregateId;
    this.eventType = props.eventType;
    this.payload = props.payload;
    this.status = props.status;
  }

  static from(props: OutboxEventModel) {
    return new OutboxEventInfo({
      aggregateId: props.aggregateId,
      eventType: props.eventType,
      payload: props.payload,
      status: props.status,
    });
  }
}
