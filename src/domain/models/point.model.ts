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
  readonly id: number;
  readonly walletId: number;
  readonly amount: number;
  readonly transactionType: TransactionType;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly expiredAt: Date | null;

  constructor(props: PointModelProps) {
    this.id = props.id;
    this.walletId = props.walletId;
    this.amount = props.amount;
    this.transactionType = props.transactionType;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.expiredAt = props.expiredAt;
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
