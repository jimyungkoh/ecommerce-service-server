import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { SignInCommand, SignUpCommand } from 'src/domain/dtos';
import { PointInfo } from 'src/domain/dtos/info';
import { PointService, UserService, WalletService } from 'src/domain/services';
import { UserSignInCriteria, UserSignUpCriteria } from '../dtos/criteria';
import { UserSignInResult } from '../dtos/results';

@Injectable()
export class UserFacade {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly pointService: PointService,
    private readonly walletService: WalletService,
    private readonly customConfigService: CustomConfigService,
  ) {}

  async signUp(userSignUpCriteria: UserSignUpCriteria) {
    return await this.userService.signUp(
      new SignUpCommand({
        email: userSignUpCriteria.email,
        password: userSignUpCriteria.password,
      }),
    );
  }

  async signIn(userSignInCriteria: UserSignInCriteria) {
    const user = await this.userService.signIn(
      new SignInCommand({
        email: userSignInCriteria.email,
        password: userSignInCriteria.password,
      }),
    );

    const accessToken = this.jwtService.sign(
      {
        sub: user.email,
      },
      {
        expiresIn: '1h',
        secret: this.customConfigService.jwtSecret,
      },
    );

    return UserSignInResult.from(accessToken);
  }

  async chargePoint(userId: number, amount: number): Promise<PointInfo> {
    return await this.pointService.chargePoint(userId, amount);
  }

  async getTotalPoint(userId: number): Promise<string> {
    return await this.walletService.getTotalPoint(userId);
  }
}
