import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { UserSignInResult } from 'src/application/dtos/results';
import { UserFacade } from 'src/application/facades';
import { Private } from 'src/common/decorators/private.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { PointInfo } from 'src/domain/dtos/info';
import { SignInRequestDto } from '../dtos/request-dtos';
import { SignUpRequestDto } from '../dtos/request-dtos/sign-up-request.dto';
import { UserRequestDto } from '../dtos/request-dtos/user-request.dto';
import { PointChargeDto } from '../dtos/wallet-charge.dto';

@ApiTags('/users')
@Controller('/users')
export class UserController {
  constructor(private readonly userFacade: UserFacade) {}

  @Post('/sign-up')
  async signUp(@Body() signUpRequestDto: SignUpRequestDto) {
    return this.userFacade.signUp({
      email: signUpRequestDto.email,
      password: signUpRequestDto.password,
    });
  }

  @Post('/sign-in')
  async signIn(
    @Res() response: Response,
    @Body() signInRequestDto: SignInRequestDto,
  ): Promise<void> {
    try {
      const result = await this.userFacade.signIn({
        email: signInRequestDto.email,
        password: signInRequestDto.password,
      });

      response
        .header('Authorization', `Bearer ${result.accessToken}`)
        .json(result);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Private()
  @Get('/wallet')
  async getWallet(@User() user: UserRequestDto): Promise<string> {
    return this.userFacade.getTotalPoint(user.id);
  }

  @Private()
  @Post('/wallet/point')
  async chargePoint(
    @User() user: UserRequestDto,
    pointChargeDto: PointChargeDto,
  ): Promise<PointInfo> {
    return this.userFacade.chargePoint(user.id, pointChargeDto.amount);
  }
}
