import Decimal from 'decimal.js';
import {
  WalletDomain,
  WalletDomainProps,
} from 'src/infrastructure/dtos/domains';

export type WalletInfoProps = WalletDomainProps;

export class WalletInfo {
  constructor(private readonly props: WalletInfoProps) {}

  get id(): number {
    return this.props.id;
  }

  get userId(): number {
    return this.props.userId;
  }

  get totalPoint(): Decimal {
    return this.props.totalPoint;
  }

  get version(): string {
    return this.props.version.toString();
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

  static from(domain: WalletDomain): WalletInfo {
    return new WalletInfo(domain);
  }
}
