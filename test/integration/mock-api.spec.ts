import axios from 'axios';
import { setupServer } from 'msw/node';
import { mockRequestHandlers } from './mocks/mock.handlers';

describe('Mock API 테스트', () => {
  const baseURL = 'http://localhost';
  const mockHandlers = mockRequestHandlers(baseURL);
  const server = setupServer(...mockHandlers);

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('POST: /balance/charge - 잔액을 충전한다', async () => {
    const response = await axios.post(`${baseURL}/balance/charge`, {
      amount: 1000,
    });
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.balance.amount).toBe(1000);
  });

  it('GET: /balance - 잔액을 조회한다', async () => {
    const response = await axios.get(`${baseURL}/balance`);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.balance).toBeDefined();
  });

  it('GET: /products - 상품 목록을 조회한다', async () => {
    const response = await axios.get(`${baseURL}/products`);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.products.length).toBe(5);
  });

  it('GET: /products/top - 인기 상품을 조회한다', async () => {
    const response = await axios.get(`${baseURL}/products/top`);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.topProducts.length).toBe(5);
  });

  it('POST: /orders - 주문을 생성한다', async () => {
    const response = await axios.post(`${baseURL}/orders`, {
      items: [{ productId: 1, quantity: 2 }],
    });
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.order).toBeDefined();
  });

  it('POST: /cart - 장바구니에 상품을 추가한다', async () => {
    const response = await axios.post(`${baseURL}/cart`, {
      productId: 1,
      quantity: 1,
    });
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
  });

  it('DELETE: /cart/{itemId} - 장바구니에서 상품을 삭제한다', async () => {
    const response = await axios.delete(`${baseURL}/cart/1`);
    expect(response.status).toBe(200);
  });

  it('GET: /cart - 장바구니를 조회한다', async () => {
    const response = await axios.get(`${baseURL}/cart`);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.cartItems).toBeDefined();
  });
});
