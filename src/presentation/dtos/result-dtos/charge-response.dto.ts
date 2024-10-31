import { TransactionType } from '@prisma/client';
import { PointInfo } from 'src/domain/dtos/info';

export type ChargeResponseDtoProps = PointInfo;

export class ChargeResponseDto {
  constructor(private readonly props: ChargeResponseDtoProps) {}

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

  static from(data: PointInfo): ChargeResponseDto {
    return new ChargeResponseDto(data);
  }
}
