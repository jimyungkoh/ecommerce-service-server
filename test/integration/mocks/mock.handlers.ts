import { http, HttpHandler, HttpResponse } from 'msw';
import {
  StubBalanceResponseType,
  StubCartItemResponseType,
  StubOrderResponseType,
  StubPopularProductResponseType,
  StubProductResponseType,
} from './stub.response.types';

/**
 * 모의 API 요청 핸들러를 생성합니다.
 * @param {string} baseURL - API의 기본 URL
 * @returns {Array} 모의 요청 핸들러 배열
 */
export const mockRequestHandlers = (baseURL: string): Array<HttpHandler> => [
  /**
   * 잔액 충전 Mock API
   * 사용자 토큰 및 충전할 금액을 받아 잔액을 충전합니다.
   */
  http.post(`${baseURL}/balance/charge`, async ({ request }) => {
    const { amount } = (await request.json()) as { amount: number };

    const balance: StubBalanceResponseType = {
      userId: 1,
      amount: amount,
      updatedAt: new Date(),
    };

    return HttpResponse.json(
      { success: true, data: { balance }, message: null },
      { status: 201 },
    );
  }),

  /**
   * 잔액 조회 Mock API
   * 사용자 토큰을 통해 해당 사용자의 잔액을 조회합니다.
   */
  http.get(`${baseURL}/balance`, () => {
    const balance: StubBalanceResponseType = {
      userId: 1,
      amount: 0,
      updatedAt: new Date(),
    };

    return HttpResponse.json({
      success: true,
      data: { balance: balance },
      message: null,
    });
  }),

  /**
   * 상품 목록 조회 Mock API
   * 상품 정보 (ID, 이름, 가격, 잔여수량)을 조회합니다.
   */
  http.get(`${baseURL}/products`, () => {
    const products: StubProductResponseType[] = [
      {
        id: 1,
        name: 'Product 1',
        price: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: 'Product 2',
        price: 15000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: 'Product 3',
        price: 20000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        name: 'Product 4',
        price: 23000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        name: 'Product 5',
        price: 23000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return HttpResponse.json({
      success: true,
      data: { products, totalPages: 1, currentPage: 1 },
      message: null,
    });
  }),

  /**
   * 인기 판매 상품 조회 Mock API
   * 최근 3일간 가장 많이 팔린 상위 5개 상품 정보를 제공합니다.
   */
  http.get(`${baseURL}/products/top`, () => {
    const popularProducts: StubPopularProductResponseType[] = [
      { id: 1, productId: 1, sales: 50, date: new Date() },
      { id: 2, productId: 2, sales: 40, date: new Date() },
      { id: 3, productId: 3, sales: 30, date: new Date() },
      { id: 4, productId: 4, sales: 20, date: new Date() },
      { id: 5, productId: 5, sales: 10, date: new Date() },
    ];

    return HttpResponse.json({
      success: true,
      data: { topProducts: popularProducts },
      message: null,
    });
  }),

  /**
   * 주문 생성 Mock API
   * 사용자 토큰과 (상품 ID, 수량) 목록을 입력받아 주문하고 결제를 수행합니다.
   */
  http.post(`${baseURL}/orders`, async ({ request }) => {
    const body = (await request.json()) as {
      items: { productId: number; quantity: number }[];
    };

    const order: StubOrderResponseType = {
      id: 1,
      userId: 1,
      totalAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      orderItems: body.items.map((item, index) => ({
        id: index + 1,
        orderId: 1,
        productId: item.productId,
        quantity: item.quantity,
        price: 0,
      })),
    };

    return HttpResponse.json(
      {
        success: true,
        data: { order },
        message: null,
      },
      { status: 201 },
    );
  }),

  /**
   * 장바구니 상품 추가 Mock API
   * 사용자가 관심 있는 상품을 장바구니에 추가합니다.
   */
  http.post(`${baseURL}/cart`, async ({ request }) => {
    const cartItem = await request.json();

    return HttpResponse.json(
      {
        success: true,
        data: cartItem,
        message: null,
      },
      { status: 201 },
    );
  }),

  /**
   * 장바구니 상품 삭제 Mock API
   * 장바구니에서 특정 상품을 삭제합니다.
   */
  http.delete(`${baseURL}/cart/:itemId`, ({}) => {
    return HttpResponse.json({ success: true, data: null, message: null });
  }),

  /**
   * 장바구니 조회 Mock API
   * 사용자의 장바구니 내용을 조회합니다.
   */
  http.get(`${baseURL}/cart`, () => {
    const cartItems: StubCartItemResponseType[] = [
      { id: 1, cartId: 1, productId: 1, quantity: 1 },
      { id: 2, cartId: 1, productId: 2, quantity: 2 },
      { id: 3, cartId: 2, productId: 3, quantity: 1 },
    ];

    return HttpResponse.json({
      success: true,
      data: { cartItems },
      message: null,
    });
  }),
];
