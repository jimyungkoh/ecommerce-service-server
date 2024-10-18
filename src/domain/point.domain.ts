import Decimal from 'decimal.js';
export const TransactionType = {
  CHARGE: 'CHARGE',
  WITHDRAW: 'WITHDRAW',
  PURCHASE: 'PURCHASE',
  REFUND: 'REFUND',
  CASHBACK: 'CASHBACK',
  PROMOTION_CREDIT: 'PROMOTION_CREDIT',
  EXPIRATION: 'EXPIRATION',
  GIFT_SENT: 'GIFT_SENT',
  GIFT_RECEIVED: 'GIFT_RECEIVED',
} as const;

export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

export class PointDomain {
  constructor(
    readonly id: bigint,
    readonly walletId: number,
    readonly amount: Decimal,
    readonly transactionType: TransactionType,
    readonly createdAt: Date,
    readonly updatedAt: Date,
    readonly expiredAt: Date | null,
  ) {}
}
