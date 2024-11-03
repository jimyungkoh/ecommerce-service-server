import { WalletModel, WalletModelProps } from 'src/domain/models';
import { InfoDTO } from '../info';

export type WalletInfoProps = WalletModelProps;

export class WalletInfo extends InfoDTO<WalletInfoProps> {
  constructor(props: WalletInfoProps) {
    super(props);
  }

  get id(): number {
    return this.props.id;
  }

  get userId(): number {
    return this.props.userId;
  }

  get totalPoint(): number {
    return this.props.totalPoint;
  }

  get version(): number {
    return this.props.version;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  payable(amount: number): boolean {
    return this.totalPoint >= amount;
  }

  static from(domain: WalletModel): WalletInfo {
    return new WalletInfo(domain);
  }
}
