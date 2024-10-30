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

export type PointDomainProps = {
  id: bigint;
  walletId: number;
  amount: Decimal;
  transactionType: TransactionType;
  createdAt: Date;
  updatedAt: Date;
  expiredAt: Date | null;
};

export class PointDomain {
  constructor(private readonly props: PointDomainProps) {}

  get id(): bigint {
    return this.props.id;
  }

  get walletId(): number {
    return this.props.walletId;
  }

  get amount(): Decimal {
    return this.props.amount;
  }

  get transactionType(): TransactionType {
    return this.props.transactionType;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get expiredAt(): Date | null {
    return this.props.expiredAt;
  }
}
