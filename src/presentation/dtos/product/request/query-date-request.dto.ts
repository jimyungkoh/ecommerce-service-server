import { IsDateString, Matches } from 'class-validator';

export class QueryDateRequestDto {
  @IsDateString(
    {},
    {
      message: '유효한 날짜 형식이어야 합니다',
    },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: '날짜는 YYYY-MM-DD 형식이어야 합니다',
  })
  date: string;
}
