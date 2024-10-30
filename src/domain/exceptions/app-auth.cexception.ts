import { HttpException, UnauthorizedException } from '@nestjs/common';
import { ApplicationException } from './application.exception';

export class AppAuthException extends ApplicationException {
  toHttp(): HttpException {
    return new UnauthorizedException();
  }
}
