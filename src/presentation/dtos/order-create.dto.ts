import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsNumber, Min, ValidateNested } from 'class-validator';

export class OrderItemCreateDto {
  @IsNumber()
  productId: number;

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
