import { ErrorCode } from 'src/common/errors';
import { ApplicationException } from './application.exception';

export class WalletNotFoundException extends ApplicationException {
  constructor(message?: string) {
    super(ErrorCode.WALLET_NOT_FOUND, message);
  }
}
