export class CreateOutboxEventParam {
  aggregateId: string;
  eventType: string;
  payload: string;
}
