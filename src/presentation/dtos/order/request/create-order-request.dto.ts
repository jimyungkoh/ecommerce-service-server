import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsNumber, Min, ValidateNested } from 'class-validator';

export class CreateOrderItemDto {
  @IsNumber()
  productId: number;

  @Min(1)
  @IsNumber()
  quantity: number;
}

export class CreateOrderRequestDto {
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[];
}
