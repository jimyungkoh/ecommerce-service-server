export type ErrorCodeType = keyof typeof ErrorCodes;

export const ErrorCodes = {
  USER_NOT_FOUND: {
    code: 1001,
    message: '사용자를 찾을 수 없습니다.',
  },
  USER_ALREADY_EXISTS: {
    code: 1002,
    message: '이미 존재하는 사용자입니다.',
  },

  USER_AUTH_FAILED: {
    code: 1003,
    message: '사용자 인증에 실패했습니다.',
  },

  USER_TOKEN_EXPIRED: {
    code: 1004,
    message: '토큰이 만료되었습니다.',
  },

  WALLET_NOT_FOUND: {
    code: 2001,
    message: '지갑을 찾을 수 없습니다.',
  },
  WALLET_INSUFFICIENT_POINT: {
    code: 2002,
    message: '잔액이 부족합니다.',
  },
  POINT_CHARGE_FAILED: {
    code: 3001,
    message: '포인트 충전에 실패했습니다.',
  },
  PRODUCT_NOT_FOUND: {
    code: 4001,
    message: '상품을 찾을 수 없습니다.',
  },
  PRODUCT_OUT_OF_STOCK: {
    code: 4002,
    message: '재고가 부족합니다.',
  },
  ORDER_NOT_FOUND: {
    code: 5001,
    message: '주문을 찾을 수 없습니다.',
  },
  PAYMENT_FAILED: {
    code: 5001,
    message: '결제에 실패했습니다.',
  },
  ORDER_FAILED: {
    code: 5002,
    message: '주문에 실패했습니다.',
  },
  CART_NOT_FOUND: {
    code: 6001,
    message: '장바구니를 찾을 수 없습니다.',
  },
} as const;
