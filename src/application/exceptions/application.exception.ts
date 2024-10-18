import { ErrorCode } from 'src/common/errors';

export abstract class ApplicationException extends Error {
  readonly status: number;
  readonly code: number;

  constructor(errorCode: ErrorCode, message?: string) {
    super(message ?? errorCode.message);
    this.status = errorCode.status;
    this.code = errorCode.code;
  }
}
