import { TransactionType } from '@prisma/client';
import { PointInfo } from 'src/domain/dtos/info';

export type ChargeResponseDtoProps = PointInfo;

export class ChargeResponseDto {
  readonly id: number;
  readonly walletId: number;
  readonly amount: number;
  readonly transactionType: TransactionType;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly expiredAt: Date | null;

  constructor(props: ChargeResponseDtoProps) {
    this.id = props.id;
    this.walletId = props.walletId;
    this.amount = props.amount;
    this.transactionType = props.transactionType;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.expiredAt = props.expiredAt;
  }

  static from(data: PointInfo): ChargeResponseDto {
    return new ChargeResponseDto(data);
  }
}
