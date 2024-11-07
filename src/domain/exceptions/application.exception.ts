import { HttpException } from '@nestjs/common';
import { ErrorCodes } from 'src/common/errors';
import { AppConflictException } from './app-conflict.exception';
import { AppNotFoundException } from './app-not-found.exception';

export abstract class ApplicationException extends Error {
  readonly code: number;
  readonly message: string;
  static readonly tag:
    | typeof AppNotFoundException
    | typeof AppConflictException;

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
