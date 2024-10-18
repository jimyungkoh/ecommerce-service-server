import { ErrorCode } from 'src/common/errors';
import { ApplicationException } from './application.exception';

export class ProductOutOfStockException extends ApplicationException {
  constructor(message?: string) {
    super(ErrorCode.PRODUCT_OUT_OF_STOCK, message);
  }
}
