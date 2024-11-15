export type ErrorCodeType = keyof typeof ErrorCodes;

export const ErrorCodes = {
  USER_NOT_FOUND: {
    tag: 'USER_NOT_FOUND',
    code: 1001,
    message: '사용자를 찾을 수 없습니다.',
  },
  USER_ALREADY_EXISTS: {
    tag: 'USER_ALREADY_EXISTS',
    code: 1002,
    message: '이미 존재하는 사용자입니다.',
  },

  USER_AUTH_FAILED: {
    tag: 'USER_AUTH_FAILED',
    code: 1003,
    message: '사용자 인증에 실패했습니다.',
  },

  USER_TOKEN_EXPIRED: {
    tag: 'USER_TOKEN_EXPIRED',
    code: 1004,
    message: '토큰이 만료되었습니다.',
  },

  WALLET_NOT_FOUND: {
    tag: 'WALLET_NOT_FOUND',
    code: 2001,
    message: '지갑을 찾을 수 없습니다.',
  },
  WALLET_INSUFFICIENT_POINT: {
    tag: 'WALLET_INSUFFICIENT_POINT',
    code: 2002,
    message: '잔액이 부족합니다.',
  },
  POINT_CHARGE_FAILED: {
    tag: 'POINT_CHARGE_FAILED',
    code: 3001,
    message: '포인트 충전에 실패했습니다.',
  },
  PRODUCT_NOT_FOUND: {
    tag: 'PRODUCT_NOT_FOUND',
    code: 4001,
    message: '상품을 찾을 수 없습니다.',
  },
  PRODUCT_OUT_OF_STOCK: {
    tag: 'PRODUCT_OUT_OF_STOCK',
    code: 4002,
    message: '재고가 부족합니다.',
  },
  ORDER_NOT_FOUND: {
    tag: 'ORDER_NOT_FOUND',
    code: 5001,
    message: '주문을 찾을 수 없습니다.',
  },
  PAYMENT_FAILED: {
    tag: 'PAYMENT_FAILED',
    code: 5001,
    message: '결제에 실패했습니다.',
  },
  ORDER_FAILED: {
    tag: 'ORDER_FAILED',
    code: 5002,
    message: '주문에 실패했습니다.',
  },
  CART_NOT_FOUND: {
    tag: 'CART_NOT_FOUND',
    code: 6001,
    message: '장바구니를 찾을 수 없습니다.',
  },
  CART_ITEM_NOT_FOUND: {
    tag: 'CART_ITEM_NOT_FOUND',
    code: 6002,
    message: '장바구니 상품을 찾을 수 없습니다.',
  },
} as const;

// type Code =
//   | 'USER_NOT_FOUND'
//   | 'WALLET_NOT_FOUND'
//   | 'WALLET_INSUFFICIENT_POINT'
//   | 'POINT_CHARGE_FAILED'
//   | 'PRODUCT_NOT_FOUND'
//   | 'PRODUCT_OUT_OF_STOCK'
//   | 'ORDER_NOT_FOUND'
//   | 'PAYMENT_FAILED'
//   | 'ORDER_FAILED'
//   | 'CART_NOT_FOUND';

// export class ErrorCode {
//   private constructor(
//     // status: HttpStatusCode 에 대응되는 개념, grpc 요구사항? graphQL 요구사항?
//     // 에러 코드를 변환하는 곳에서, 올바른 HttpException으로 바꿔줘야함
//     // Domain Error가 HttpStatus를 아는게 에러다.
//     readonly status: number,
//     readonly code: number,
//     readonly message: string,
//   ) {}

//   // 이걸 static으로 만들어두면, 클래스 정의한 이유가 따로 없을 것인데요?

//   // 사용자 관련 에러 코드
//   static readonly USER_NOT_FOUND = new ErrorCode(
//     404,
//     1001,
//     '사용자를 찾을 수 없습니다.',
//   );

//   // 지갑 관련 에러 코드
//   static readonly WALLET_NOT_FOUND = new ErrorCode(
//     404,
//     2001,
//     '지갑을 찾을 수 없습니다.',
//   );

//   static readonly WALLET_INSUFFICIENT_POINT = new ErrorCode(
//     400,
//     2002,
//     '잔액이 부족합니다.',
//   );

//   // 포인트 관련 에러 코드
//   static readonly POINT_CHARGE_FAILED = new ErrorCode(
//     409,
//     3001,
//     '포인트 충전에 실패했습니다.',
//   );

//   // 상품 관련 에러 코드
//   static readonly PRODUCT_NOT_FOUND = new ErrorCode(
//     404,
//     4001,
//     '상품을 찾을 수 없습니다.',
//   );

//   static readonly PRODUCT_OUT_OF_STOCK = new ErrorCode(
//     400,
//     4002,
//     '재고가 부족합니다.',
//   );

//   // 주문 관련 에러 코드
//   static readonly ORDER_NOT_FOUND = new ErrorCode(
//     404,
//     5001,
//     '주문을 찾을 수 없습니다.',
//   );

//   static readonly PAYMENT_FAILED = new ErrorCode(
//     409,
//     5001,
//     '결제에 실패했습니다.',
//   );

//   static readonly ORDER_FAILED = new ErrorCode(
//     409,
//     5002,
//     '주문에 실패했습니다.',
//   );

//   // 장바구니 관련 에러 코드
//   static readonly CART_NOT_FOUND = new ErrorCode(
//     404,
//     6001,
//     '장바구니를 찾을 수 없습니다.',
//   );
// }

// type Code =
//   | 'USER_NOT_FOUND'
//   | 'WALLET_NOT_FOUND'
//   | 'WALLET_INSUFFICIENT_POINT'
//   | 'POINT_CHARGE_FAILED'
//   | 'PRODUCT_NOT_FOUND'
//   | 'PRODUCT_OUT_OF_STOCK'
//   | 'ORDER_NOT_FOUND'
//   | 'PAYMENT_FAILED'
//   | 'ORDER_FAILED'
//   | 'CART_NOT_FOUND';

// const f = <T extends typeof ConstErrorCode, K extends keyof T>(
//   errorMap: T,
//   key: K,
// ) => {
//   return errorMap[key];
// };

// type Err<E> = E;
// type Ok<R> = R;

// type Effect<R, E> = {
//   Ok?: Ok<R>;
//   Err?: Err<E>;
// };

// //repository
// const findUser: Effect<User, typeof ConstErrorCode.USER_NOT_FOUND> = (
//   id: string,
// ) => {
//   const user = prisma.user.findUnique(id); // user || null

//   switch (user) {
//     case null:
//       return { Err: ConstErrorCode.USER_NOT_FOUND };
//     default:
//       return { Ok: user };
//   }
// };

// effect-ts 라는 라이브러리가 있고, 거기서는 이 방식을 사용한다.
