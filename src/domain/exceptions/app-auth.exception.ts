import { HttpException, UnauthorizedException } from '@nestjs/common';
import { ApplicationException } from './application.exception';

export class AppAuthException extends ApplicationException {
  readonly _tag = 'AppAuthException';
  toHttp(): HttpException {
    return new UnauthorizedException(this.message);
  }
}
