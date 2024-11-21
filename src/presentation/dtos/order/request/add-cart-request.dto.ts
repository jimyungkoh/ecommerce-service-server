import { IsNumber, Min } from 'class-validator';

export class AddCartRequestDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  productId: number;

  @Min(1)
  @IsNumber()
  quantity: number;
}
