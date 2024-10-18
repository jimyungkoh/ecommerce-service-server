import { ErrorCode } from 'src/common/errors';
import { ApplicationException } from './application.exception';

export class OrderFailedException extends ApplicationException {
  constructor(message?: string) {
    super(ErrorCode.ORDER_FAILED, message);
  }
}
