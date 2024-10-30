import { IsNumber, Min } from 'class-validator';

export class PointChargeDto {
  @IsNumber(
    {},
    {
      message: '충전할 포인트는 숫자여야 합니다',
    },
  )
  @Min(1, {
    message: '충전할 포인트는 1 이상이어야 합니다',
  })
  amount: number;
}
