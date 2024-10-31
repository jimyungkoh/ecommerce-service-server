import { HttpException } from '@nestjs/common';
import { ErrorCodes } from 'src/common/errors';

export abstract class ApplicationException extends Error {
  readonly code: number;

  constructor(
    readonly errorCode: (typeof ErrorCodes)[keyof typeof ErrorCodes],
    message?: string,
  ) {
    super(message ?? errorCode.message);
    Error.captureStackTrace(this, this.constructor);
    this.code = errorCode.code;
  }

  abstract toHttp(): HttpException;
}
