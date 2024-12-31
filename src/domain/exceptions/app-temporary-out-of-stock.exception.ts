import { BadRequestException, HttpException } from '@nestjs/common';
import { ApplicationException } from './application.exception';

export class AppBadRequestException extends ApplicationException {
  readonly _tag = 'AppBadRequestException';

  toHttp(): HttpException {
    return new BadRequestException(this.message);
  }
}
