import { ErrorCode } from 'src/common/errors';
import { ApplicationException } from './application.exception';

export class UserNotFoundException extends ApplicationException {
  constructor(message?: string) {
    super(ErrorCode.USER_NOT_FOUND, message);
  }
}
