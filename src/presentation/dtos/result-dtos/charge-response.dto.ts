import { TransactionType } from '@prisma/client';
import { PointInfo } from 'src/domain/dtos/info';
import { ResponseDTO } from './response.dto';

export type ChargeResponseDtoProps = PointInfo;

export class ChargeResponseDto extends ResponseDTO<ChargeResponseDtoProps> {
  constructor(props: ChargeResponseDtoProps) {
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

  static from(data: PointInfo): ChargeResponseDto {
    return new ChargeResponseDto(data);
  }
}
