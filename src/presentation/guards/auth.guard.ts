import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Effect } from 'effect';
import { Request } from 'express';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { IS_PRIVATE_KEY } from 'src/common/decorators/private.decorator';
import { ErrorCodes } from 'src/common/errors';
import { ApplicationException } from 'src/domain/exceptions/application.exception';
import { UserService } from 'src/domain/services';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';

@Injectable()
export class AuthGuard implements CanActivate {
  readonly salt: number;

  constructor(
    private readonly configService: CustomConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {
    this.salt = this.configService.saltRounds;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPrivate = this.reflector.get(IS_PRIVATE_KEY, context.getHandler());
    if (!isPrivate) return true;

    try {
      const request = context.switchToHttp().getRequest();
      const token = this.extractBearerToken(request);

      if (!token) {
        throw new UnauthorizedException(ErrorCodes.USER_AUTH_FAILED);
      }
      const userPayload = this.jwtService.verify(token);

      if (!userPayload?.sub) {
        throw new UnauthorizedException(ErrorCodes.USER_AUTH_FAILED);
      }
      const user = await Effect.runPromise(
        this.userService.getByEmail(userPayload.sub as string),
      );

      request.user = user;
      return true;
    } catch (error) {
      this.logger.error(JSON.stringify(error));
      if (
        error instanceof HttpException ||
        error instanceof ApplicationException
      ) {
        throw error;
      } else if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException(ErrorCodes.USER_TOKEN_EXPIRED);
      }

      throw new UnauthorizedException(ErrorCodes.USER_AUTH_FAILED);
    }
  }

  private extractBearerToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
