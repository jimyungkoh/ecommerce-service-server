import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PointDomain } from 'src/domain';
import { PointService } from '../services/point.service';
import { WalletService } from '../services/wallet.service';

@Injectable()
export class WalletUseCase {
  constructor(
    private readonly pointManager: PointService,
    private readonly walletManager: WalletService,
  ) {}

  async chargePoint(userId: number, amount: number): Promise<PointDomain> {
    return await this.pointManager.chargePoint(userId, amount);
  }

  async getTotalPoint(userId: number): Promise<Decimal> {
    return await this.walletManager.getTotalPoint(userId);
  }
}
