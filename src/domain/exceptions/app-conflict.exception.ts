import { ConflictException, HttpException } from '@nestjs/common';
import { ApplicationException } from './application.exception';

export class AppConflictException extends ApplicationException {
  readonly _tag = 'AppConflictException';
  toHttp(): HttpException {
    return new ConflictException(this.message);
  }
}
