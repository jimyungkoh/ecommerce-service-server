import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PointDomain } from 'src/domain';
import { PointService } from '../services/point.service';
import { WalletService } from '../services/wallet.service';

@Injectable()
export class WalletFacade {
  constructor(
    private readonly pointService: PointService,
    private readonly walletService: WalletService,
  ) {}

  async chargePoint(userId: number, amount: number): Promise<PointDomain> {
    return await this.pointService.chargePoint(userId, amount);
  }

  async getTotalPoint(userId: number): Promise<Decimal> {
    return await this.walletService.getTotalPoint(userId);
  }
}
