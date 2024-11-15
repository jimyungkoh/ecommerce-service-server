import { HttpException, NotFoundException } from '@nestjs/common';
import { ApplicationException } from './application.exception';

export class AppNotFoundException extends ApplicationException {
  readonly _tag = 'AppNotFoundException';
  toHttp(): HttpException {
    return new NotFoundException(this.message);
  }
}
