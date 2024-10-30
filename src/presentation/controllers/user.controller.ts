import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserFacade } from 'src/application/facades';
import { Private } from 'src/common/decorators/private.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { PointInfo } from 'src/domain/dtos/info';
import { UserRequestDto } from '../dtos/request-dtos/user-request.dto';
import { PointChargeDto } from '../dtos/wallet-charge.dto';

@ApiTags('/users')
@Controller('/users')
export class UserController {
  constructor(private readonly userFacade: UserFacade) {}

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
