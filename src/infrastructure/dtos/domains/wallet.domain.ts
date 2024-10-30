import Decimal from 'decimal.js';

export type WalletDomainProps = {
  id: number;
  userId: number;
  totalPoint: Decimal;
  version: bigint;
  createdAt: Date;
  updatedAt: Date;
};

export class WalletDomain {
  constructor(private readonly props: WalletDomainProps) {}

  get id(): number {
    return this.props.id;
  }

  get userId(): number {
    return this.props.userId;
  }

  get totalPoint(): Decimal {
    return this.props.totalPoint;
  }

  get version(): bigint {
    return this.props.version;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  payable(amount: Decimal): boolean {
    return this.totalPoint.greaterThanOrEqualTo(amount);
  }
}
