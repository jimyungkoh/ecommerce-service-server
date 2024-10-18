export class ErrorCode {
  private constructor(
    readonly status: number,
    readonly code: number,
    readonly message: string,
  ) {}

  // 사용자 관련 에러 코드
  static readonly USER_NOT_FOUND = new ErrorCode(
    404,
    1001,
    '사용자를 찾을 수 없습니다.',
  );

  // 지갑 관련 에러 코드
  static readonly WALLET_NOT_FOUND = new ErrorCode(
    404,
    2001,
    '지갑을 찾을 수 없습니다.',
  );

  static readonly WALLET_INSUFFICIENT_POINT = new ErrorCode(
    400,
    2002,
    '잔액이 부족합니다.',
  );

  // 포인트 관련 에러 코드
  static readonly POINT_CHARGE_FAILED = new ErrorCode(
    409,
    3001,
    '포인트 충전에 실패했습니다.',
  );

  // 상품 관련 에러 코드
  static readonly PRODUCT_NOT_FOUND = new ErrorCode(
    404,
    4001,
    '상품을 찾을 수 없습니다.',
  );

  static readonly PRODUCT_OUT_OF_STOCK = new ErrorCode(
    400,
    4002,
    '재고가 부족합니다.',
  );

  // 주문 관련 에러 코드
  static readonly PAYMENT_FAILED = new ErrorCode(
    409,
    5001,
    '결제에 실패했습니다.',
  );

  static readonly ORDER_FAILED = new ErrorCode(
    409,
    5002,
    '주문에 실패했습니다.',
  );
}
