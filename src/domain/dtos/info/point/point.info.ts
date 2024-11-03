import {
  PointModel,
  PointModelProps,
  TransactionType,
} from 'src/domain/models';
import { InfoDTO } from '../info';

export type PointInfoProps = PointModelProps;

export class PointInfo extends InfoDTO<PointInfoProps> {
  constructor(props: PointInfoProps) {
    super(props);
  }

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
