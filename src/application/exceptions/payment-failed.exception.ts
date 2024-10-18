import { ErrorCode } from 'src/common/errors';
import { ApplicationException } from './application.exception';

export class PaymentFailedException extends ApplicationException {
  constructor(message?: string) {
    super(ErrorCode.PAYMENT_FAILED, message);
  }
}
