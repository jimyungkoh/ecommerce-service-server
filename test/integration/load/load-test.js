import { check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

// 메트릭 정의
const orderSuccess = new Counter('order_success');
const orderFailure = new Counter('order_failure');
const orderLatency = new Trend('order_latency');
const orderSuccessRate = new Rate('order_success_rate');

export const options = {
  scenarios: {
    order_burst: {
      executor: 'ramping-arrival-rate',
      preAllocatedVUs: 1000,
      timeUnit: '1s',
      stages: [
        { duration: '30s', target: 500 }, // 30초간 500 RPS까지 증가
        { duration: '1m', target: 1000 }, // 1분간 1000 RPS까지 증가
        { duration: '3m', target: 1000 }, // 3분간 1000 RPS 유지
        { duration: '30s', target: 0 }, // 30초간 정상 종료
      ],
    },
  },
  thresholds: {
    'http_req_duration{type:order}': ['p(95)<2000'], // 95% 요청이 2초 이내 처리
    'http_req_failed{type:order}': ['rate<0.1'], // 실패율 10% 미만
    order_success_rate: ['value>0.9'], // 주문 성공률 90% 이상
  },
};

const API_BASE_URL = 'http://localhost:3000';
const USERS_POOL_SIZE = 50; // 50명의 테스트 사용자
const INITIAL_STOCK = 3000; // 초기 재고 3000개

const login = (userId) => {
  const res = http.post(
    `${API_BASE_URL}/users/sign-in`,
    JSON.stringify({
      email: `test${userId}@example.com`,
      password: 'test1234',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (res.status !== 201) return null;
  return res.json('accessToken');
};

export function setup() {
  // 테스트 사용자 토큰 발급
  const tokens = [];
  for (let i = 0; i < USERS_POOL_SIZE; i++) {
    const token = login(i + 1);
    if (token) tokens.push(token);
  }

  if (tokens.length === 0) throw new Error('Login failed');

  // 초기 재고 확인
  const stockRes = http.get(`${API_BASE_URL}/products/1`);
  console.log(`초기 재고: ${stockRes.json().stock}개`);

  return { tokens };
}

export default function (data) {
  const token = data.tokens[Math.floor(Math.random() * data.tokens.length)];

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 주문 생성 및 응답시간 측정
  const startTime = new Date();
  const orderRes = http.post(
    `${API_BASE_URL}/orders`,
    JSON.stringify({
      orderItems: [
        {
          productId: 1,
          quantity: 1,
        },
      ],
    }),
    {
      headers,
      tags: { type: 'order' },
    },
  );
  orderLatency.add(new Date() - startTime);

  const success = check(orderRes, {
    'order success': (r) => r.status === 201,
  });

  if (success) {
    orderSuccess.add(1);
    orderSuccessRate.add(1);
  } else {
    orderFailure.add(1);
    orderSuccessRate.add(0);
    console.error(`주문 실패: ${orderRes.status} - ${orderRes.body}`);
  }

  sleep(0.5);
}

export function teardown(data) {
  const stockRes = http.get(`${API_BASE_URL}/products/1`);
  const finalStock = stockRes.json().stock;
  const expectedStock = INITIAL_STOCK - orderSuccess.values;

  console.log(`
    === 테스트 결과 ===
    초기 재고: ${INITIAL_STOCK}개
    최종 재고: ${finalStock}개
    예상 재고: ${expectedStock}개
    재고 정합성: ${finalStock === expectedStock ? '성공 ✓' : '실패 ✗'}

    === 주문 처리 현황 ===
    총 성공 주문: ${orderSuccess.values}건
    총 실패 주문: ${orderFailure.values}건
    평균 응답시간: ${orderLatency.values.avg}ms
    95% 응답시간: ${orderLatency.values.p(95)}ms
`);
}
