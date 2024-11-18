import {
  PointModel,
  PointModelProps,
  TransactionType,
} from 'src/domain/models';

export type PointInfoProps = PointModelProps;

export class PointInfo {
  readonly id: number;
  readonly walletId: number;
  readonly amount: number;
  readonly transactionType: TransactionType;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly expiredAt: Date | null;

  constructor(props: PointInfoProps) {
    this.id = props.id;
    this.walletId = props.walletId;
    this.amount = props.amount;
    this.transactionType = props.transactionType;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.expiredAt = props.expiredAt;
  }

  static from(domain: PointModel): PointInfo {
    return new PointInfo({
      id: domain.id,
      walletId: domain.walletId,
      amount: domain.amount,
      transactionType: domain.transactionType,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      expiredAt: domain.expiredAt,
    });
  }
}
