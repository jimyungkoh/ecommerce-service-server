import { ArrayNotEmpty, IsNumber, Min, ValidateNested } from 'class-validator';
import { IsBigInt } from 'src/common/decorators';

export class OrderItemCreateDto {
  @IsBigInt()
  productId: bigint;

  @Min(1)
  @IsNumber()
  quantity: number;
}

export class OrderCreateDto {
  @IsNumber()
  userId: number;

  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  orderItems: OrderItemCreateDto[];
}
