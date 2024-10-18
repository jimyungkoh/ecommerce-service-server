import { ErrorCode } from 'src/common/errors';
import { ApplicationException } from './application.exception';

export class WalletInsufficientPointException extends ApplicationException {
  constructor(message?: string) {
    super(ErrorCode.WALLET_INSUFFICIENT_POINT, message);
  }
}
