import { ErrorCode } from 'src/common/errors';
import { ApplicationException } from './application.exception';

export class ProductNotFoundException extends ApplicationException {
  constructor(message?: string) {
    super(ErrorCode.PRODUCT_NOT_FOUND, message);
  }
}
