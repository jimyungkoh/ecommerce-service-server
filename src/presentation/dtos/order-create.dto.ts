import { Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsNumber, Min, ValidateNested } from 'class-validator';
import { IsBigInt } from 'src/common/decorators';

export class OrderItemCreateDto {
  @IsBigInt()
  @Transform(({ value }) => BigInt(value))
  productId: bigint;

  @Min(1)
  @IsNumber()
  quantity: number;
}

export class OrderCreateDto {
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemCreateDto)
  orderItems: OrderItemCreateDto[];
}
