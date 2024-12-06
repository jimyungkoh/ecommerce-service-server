import { OutboxEventStatus, OutboxEventType } from 'src/domain/models';

export class CreateOutboxEventCommand {
  readonly aggregateId: string;
  readonly eventType: OutboxEventType;
  readonly payload: string;
  readonly status?: OutboxEventStatus;

  constructor(props: CreateOutboxEventCommand) {
    this.aggregateId = props.aggregateId;
    this.eventType = props.eventType;
    this.payload = props.payload;
    this.status = props.status;
  }
}
