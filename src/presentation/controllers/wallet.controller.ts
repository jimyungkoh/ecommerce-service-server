import { TypedException, TypedRoute } from '@nestia/core';
import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import {
  PointChargeFailedException,
  WalletNotFoundException,
} from 'src/application/exceptions';
import { WalletUseCase } from 'src/application/use-cases';
import { ErrorCode } from 'src/common/errors';
import { PointDomain } from 'src/domain';
import { PointChargeDto } from '../dto/wallet-charge.dto';

/**
 * 지갑 관련 요청을 처리하는 컨트롤러 클래스입니다.
 */
@ApiTags('wallets')
@Controller('wallets')
export class WalletController {
  /**
   * WalletController 인스턴스를 생성합니다.
   * @param walletUseCase - 지갑 관련 비즈니스 로직을 처리하는 서비스
   */
  constructor(private readonly walletUseCase: WalletUseCase) {}

  /**
   * 특정 사용자의 지갑 정보를 조회합니다.
   * @param userId - 지갑 정보를 조회할 사용자의 ID
   * @returns 사용자의 총 포인트 정보를 반환합니다.
   */
  @TypedRoute.Get(':userId')
  @TypedException<WalletNotFoundException>({
    status: ErrorCode.WALLET_NOT_FOUND.status,
    description: ErrorCode.WALLET_NOT_FOUND.message,
  })
  @Get(':userId')
  async getWallet(
    @Param('userId')
    userId: number,
  ): Promise<Decimal> {
    return this.walletUseCase.getTotalPoint(userId);
  }

  /**
   * 특정 사용자의 지갑에 포인트를 충전합니다.
   * @param userId - 포인트를 충전할 사용자의 ID
   * @param pointChargeDto - 충전할 포인트 정보가 담긴 DTO
   * @returns 충전된 포인트 정보를 반환합니다.
   */
  @TypedRoute.Post(':userId/charge')
  @TypedException<WalletNotFoundException>({
    status: ErrorCode.WALLET_NOT_FOUND.status,
    description: ErrorCode.WALLET_NOT_FOUND.message,
  })
  @TypedException<PointChargeFailedException>({
    status: ErrorCode.POINT_CHARGE_FAILED.status,
    description: ErrorCode.POINT_CHARGE_FAILED.message,
  })
  @Post(':userId/charge')
  async chargeWallet(
    @Param('userId')
    userId: number,
    pointChargeDto: PointChargeDto,
  ): Promise<PointDomain> {
    return this.walletUseCase.chargePoint(userId, pointChargeDto.amount);
  }
}
