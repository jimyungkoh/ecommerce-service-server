import { Body, Controller, Get, Inject, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Effect, pipe } from 'effect';
import { Response } from 'express';
import { UserFacade } from 'src/application/facades';
import { Private } from 'src/common/decorators/private.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import {
  ChargeResponseDto,
  PointChargeRequestDto,
  SignInRequestDto,
  SignUpRequestDto,
  UserRequestDto,
} from '../dtos';

@ApiTags('/users')
@Controller('/users')
export class UserController {
  constructor(
    private readonly userFacade: UserFacade,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  @Post('/sign-up')
  signUp(@Body() signUpRequestDto: SignUpRequestDto) {
    return this.userFacade.signUp(signUpRequestDto);
  }

  @Post('/sign-in')
  signIn(
    @Res() response: Response,
    @Body() signInRequestDto: SignInRequestDto,
  ) {
    return pipe(
      this.userFacade.signIn(signInRequestDto),
      Effect.map((result) => {
        response
          .header('Authorization', `Bearer ${result.accessToken}`)
          .json(result);
      }),
    );
  }

  @Private()
  @Get('/wallet')
  getWallet(@User() user: UserRequestDto) {
    return this.userFacade.getTotalPoint(user.id);
  }

  @Private()
  @Post('/wallet/point')
  chargePoint(
    @User() user: UserRequestDto,
    @Body() pointChargeDto: PointChargeRequestDto,
  ) {
    return pipe(
      this.userFacade.chargePoint(user.id, pointChargeDto.amount),
      Effect.map(ChargeResponseDto.from),
    );
  }
}
