import { ErrorCode } from 'src/common/errors';
import { ApplicationException } from './application.exception';

export class PointChargeFailedException extends ApplicationException {
  constructor(message?: string) {
    super(ErrorCode.POINT_CHARGE_FAILED, message);
  }
}
