import { IsNumber, Min } from 'class-validator';
import { IsBigInt } from 'src/common/decorators';

export class AddCartDto {
  @IsNumber()
  userId: number;

  @IsBigInt()
  productId: bigint;

  @Min(1)
  @IsNumber()
  quantity: number;
}
