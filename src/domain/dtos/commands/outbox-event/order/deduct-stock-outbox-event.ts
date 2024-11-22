import { ProductStockInfo } from 'src/domain/dtos/info';

export class DeductStockOutboxEvent {
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: string;

  constructor(aggregateId: string, payload: ProductStockInfo[]) {
    this.aggregateId = aggregateId;
    this.eventType = 'stock.deducted';
    this.payload = JSON.stringify(payload);
  }
}
