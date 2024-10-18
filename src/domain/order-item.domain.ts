import Decimal from 'decimal.js';

export class OrderItemDomain {
  constructor(
    readonly id: bigint,
    readonly orderId: bigint,
    readonly productId: bigint,
    readonly quantity: number,
    readonly price: Decimal,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}
}
