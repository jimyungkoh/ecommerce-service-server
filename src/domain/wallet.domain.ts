import Decimal from 'decimal.js';

export class WalletDomain {
  constructor(
    readonly id: number,
    readonly userId: number,
    readonly totalPoint: Decimal,
    readonly version: bigint,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  payable(amount: Decimal): boolean {
    return this.totalPoint.greaterThanOrEqualTo(amount);
  }
}
