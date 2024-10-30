import {
  PointDomain,
  PointDomainProps,
  TransactionType,
} from 'src/infrastructure/dtos/domains';

export type PointInfoProps = PointDomainProps;

export class PointInfo {
  constructor(private readonly props: PointInfoProps) {}

  get id(): string {
    return this.props.id.toString();
  }

  get walletId(): number {
    return this.props.walletId;
  }

  get amount(): string {
    return this.props.amount.toString();
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

  static from(domain: PointDomain): PointInfo {
    return new PointInfo(domain);
  }
}
