import { WalletModel, WalletModelProps } from 'src/domain/models';

export type WalletInfoProps = WalletModelProps;

export class WalletInfo {
  readonly id: number;
  readonly userId: number;
  readonly totalPoint: number;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: WalletInfoProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.totalPoint = props.totalPoint;
    this.version = props.version;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  payable(amount: number): boolean {
    return this.totalPoint >= amount;
  }

  static from(domain: WalletModel): WalletInfo {
    return new WalletInfo(domain);
  }
}
