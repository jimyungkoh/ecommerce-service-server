import { Point } from '@prisma/client';
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

export type PointModelProps = {
  id: number;
  walletId: number;
  amount: number;
  transactionType: TransactionType;
  createdAt: Date;
  updatedAt: Date;
  expiredAt: Date | null;
};

export class PointModel {
  constructor(private readonly props: PointModelProps) {}

  get id(): number {
    return this.props.id;
  }

  get walletId(): number {
    return this.props.walletId;
  }

  get amount(): number {
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

  static from(point: Point): PointModel {
    return new PointModel({
      id: Number(point.id),
      walletId: point.walletId,
      amount: Number(point.amount),
      transactionType: point.transactionType,
      createdAt: point.createdAt,
      updatedAt: point.updatedAt,
      expiredAt: point.expiredAt,
    });
  }
}
