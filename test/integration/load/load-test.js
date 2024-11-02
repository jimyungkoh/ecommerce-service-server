import { check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend, textSummary } from 'k6/metrics';

// 커스텀 메트릭을 전역으로 내보내기

// 충전 시나리오
export const pointChargeSuccess = new Counter('point_charge_success');
export const pointChargeFailure = new Counter('point_charge_failure');
export const chargeResponseTime = new Trend('charge_response_time');
export const chargeSuccessRate = new Rate('charge_success_rate');

// 구매 시나리오
export const purchaseSuccess = new Counter('purchase_success');
export const purchaseFailure = new Counter('purchase_failure');
export const purchaseResponseTime = new Trend('purchase_response_time');
export const purchaseSuccessRate = new Rate('purchase_success_rate');

export const options = {
  scenarios: {
    // charge_point: {
    //   executor: 'per-vu-iterations',
    //   vus: 1_000,
    //   iterations: 1,
    //   exec: 'chargeScenario',
    //   startTime: '0s',
    // },
    purchase: {
      exec: 'purchaseScenario',
      // executor: 'per-vu-iterations',
      // vus: 1_000,
      // iterations: 1,
      // startTime: '5s',
      executor: 'shared-iterations',
      vus: 1000,
      iterations: 1000,
      maxDuration: '10s',
    },
  },
  thresholds: {
    'http_req_duration{name:ChargePoints}': ['p(95)<2000'],
    'http_req_duration{name:Purchase}': ['p(95)<2000'],
    'http_req_failed{name:Purchase}': ['rate>=0.9'],
    'http_reqs{name:ChargePoints}': ['count==1000'],
    'http_reqs{name:Purchase}': ['count==1000'],
  },
};

// 로그인 시나리오
const signIn = (id) => {
  const email = `test${id}@example.com`;
  const password = 'test1234';

  const signinResponse = http.post(
    'http://localhost:3000/users/sign-in',
    JSON.stringify({
      email,
      password,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  console.log(`Login attempt for ${email}: status ${signinResponse.status}`);

  check(signinResponse, {
    'signin successful': (r) => r.status === 201,
    'token received': (r) => r.json('accessToken') !== undefined,
  });

  if (signinResponse.status !== 201) {
    return null;
  }

  const responseBody = signinResponse.json();

  return responseBody.accessToken;
};

// 구매 시나리오
/**
 * 단일 상품의 재고는 100개임
 * 따라서 총 100개의 상품을 구매할 수 있음
 * 임의의 유저들이 1_000개의 요청을 보내면 100개의 요청은 성공함 900개의 요청은 실패해야 함
 */
export function purchaseScenario(data) {
  const { purchaseUserToken } = data;
  const headers = {
    Authorization: `Bearer ${purchaseUserToken}`,
    'Content-Type': 'application/json',
  };

  // 상품 ID는 1번 상품으로 고정
  const productId = 1;
  // 상품 1개 구매
  const quantity = 1;

  const purchaseResponse = http.post(
    'http://localhost:3000/orders',
    JSON.stringify({
      orderItems: [
        {
          productId,
          quantity,
        },
      ],
    }),
    {
      headers,
      tags: {
        name: 'Purchase',
      },
    },
  );

  purchaseResponseTime.add(purchaseResponse.timings.duration);

  const statusCheck = check(purchaseResponse, {
    'purchase successful': (r) => r.status === 201,
  });

  if (statusCheck) {
    purchaseSuccess.add(1);
    purchaseSuccessRate.add(1);
    console.log(
      `Purchase successful: productId=${productId}, quantity=${quantity}, time=${purchaseResponse.timings.duration}ms`,
    );
  } else {
    purchaseFailure.add(1);
    purchaseSuccessRate.add(0);
    console.error(
      `Purchase failed: status=${purchaseResponse.status}, body=${purchaseResponse.body}, time=${purchaseResponse.timings.duration}ms`,
    );
  }

  sleep(0.5);
}

// VU별 초기화 코드 (각 VU마다 한 번씩 실행)
export function setup() {
  const chargeUserToken = signIn(1);
  const purchaseUserToken = signIn(Math.floor(Math.random() * 50) + 1);

  if (!chargeUserToken || !purchaseUserToken) {
    throw new Error('Failed to login');
  }
  return { chargeUserToken, purchaseUserToken };
}

// 충전 시나리오
export function chargeScenario(data) {
  const { chargeUserToken } = data;

  const headers = {
    Authorization: `Bearer ${chargeUserToken}`,
    'Content-Type': 'application/json',
  };

  const chargeAmount = Math.floor(Math.random() * 900000) + 100000;

  const chargeResponse = http.post(
    'http://localhost:3000/users/wallet/point',
    JSON.stringify({
      amount: chargeAmount,
    }),
    {
      headers,
      tags: {
        name: 'ChargePoints',
      },
    },
  );

  // 메트릭 기록
  chargeResponseTime.add(chargeResponse.timings.duration);

  const statusCheck = check(chargeResponse, {
    'charge successful': (r) => r.status === 201,
  });

  // 성공/실패 메트릭 기록
  if (statusCheck) {
    pointChargeSuccess.add(1);
    chargeSuccessRate.add(1);
    console.log(
      `Charge successful: amount=${chargeAmount}, time=${chargeResponse.timings.duration}ms`,
    );
  } else {
    pointChargeFailure.add(1);
    chargeSuccessRate.add(0);
    // console.error(
    //   `Charge failed: status=${chargeResponse.status}, body=${chargeResponse.body}, time=${chargeResponse.timings.duration}ms`,
    // );
  }

  const timeCheck = check(chargeResponse, {
    'response time OK': (r) => r.timings.duration < 1000,
  });

  if (!timeCheck) {
    console.warn(`Slow response: ${chargeResponse.timings.duration}ms`);
  }

  sleep(0.1);

  const balanceResponse = http.get('http://localhost:3000/users/wallet', {
    headers,
  });

  check(balanceResponse, {
    'balance check successful': (r) => r.status === 200,
  });
}

export function teardown() {
  const headers = {
    'Content-Type': 'application/json',
  };

  // 1번 상품의 재고 조회
  const stockResponse = http.get('http://localhost:3000/products/1', {
    headers,
  });

  // 검증 결과 출력
  console.log('\n=== Stock Validation ===');
  console.log(stockResponse.json());
  console.log(`Final stock: ${stockResponse.json().stock}`);
  console.log(
    `Validation ${stockResponse.json().stock === 100 ? 'PASSED ✓' : 'FAILED ✗'}`,
  );
}

// 결과 분석
export function handleSummary(data) {
  const summary = {
    metrics: {
      // charge: {
      //   avg_response_time: data.metrics.charge_response_time?.avg || 0,
      //   p95_response_time: data.metrics.charge_response_time?.['p(95)'] || 0,
      //   success_count: data.metrics.point_charge_success?.count || 0,
      //   failure_count: data.metrics.point_charge_failure?.count || 0,
      //   success_rate: data.metrics.charge_success_rate?.rate || 0,
      // },
      purchase: {
        avg_response_time: data.metrics.purchase_response_time?.avg || 0,
        p95_response_time: data.metrics.purchase_response_time?.['p(95)'] || 0,
        success_count: data.metrics.purchase_success?.count || 0,
        failure_count: data.metrics.purchase_failure?.count || 0,
        success_rate: data.metrics.purchase_success_rate?.rate || 0,
      },
      total_requests: data.metrics.iterations?.count || 0,
    },
    timestamps: {
      start: data.state.testStart,
      end: data.state.testEnd,
    },
  };

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'charge-test-summary.json': JSON.stringify(summary),
  };
}

// // default 함수 시작 전에 testUsers 배열 확인
// export function handleSummary(data) {
//   console.log(`Before starting tests, testUsers length: ${testUsers.length}`);
//   return {};
// }

// const getHeaders = (accessToken) => ({
//   Authorization: `Bearer ${accessToken}`,
//   'Content-Type': 'application/json',
// });
