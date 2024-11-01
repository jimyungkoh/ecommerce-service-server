# 동시성 이슈 분석 및 제어 방식 검토

| 방식                     | 장점                                                                        | 단점                                                         |
| ------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Optimistic Lock          | 실제 충돌이 적을 때 성능이 우수<br>구현이 상대적으로 단순<br>DB 부하가 적음 | 충돌 시 재시도 로직 필요<br>높은 동시성 상황에서 재시도 증가 |
| Pessimistic Lock         | 데이터 정합성 보장이 확실<br>충돌이 많은 상황에서 효율적                    | DB 성능 저하 가능성<br>데드락 위험<br>확장성 제한            |
| Distributed Lock (Redis) | 분산 환경에서 효과적<br>DB 부하 감소<br>높은 확장성                         | 추가 인프라 필요<br>구현 복잡도 증가<br>Redis 장애 시 영향   |

## 1. 시나리오별 동시성 이슈 분석

### 1.1 포인트 충전 시나리오

```mermaid
sequenceDiagram
 Client->>+Server: 포인트 충전 요청
 Server->>Wallet: 지갑 잔액 조회
 Wallet-->>Server: 현재 잔액 반환
 Server->>Wallet: 잔액 업데이트 (version check)
 alt 낙관락 성공
 Wallet-->>Server: 업데이트 완료
 Server-->>Client: 충전 완료 응답
 else 낙관락 실패
 Wallet-->>Server: 버전 충돌, 업데이트 실패
 Server-->>Client: 재시도 요청
 end
```

**발생 가능한 이슈:**

- 동시에 여러 충전 요청으로 인한 Race Condition 발생
- 동시 트랜잭션 접근으로 인한 잔액 정합성 훼손

**낙관적 락 선택 이유:**

- 단일 사용자의 동시 접근 빈도가 낮음
- 충돌 시 재시도로 해결 가능
- DB 락 사용 최소화로 성능 확보

### 1.2 상품 구매 시나리오

```mermaid
sequenceDiagram
 Client->>+Server: 상품 구매 요청
 Server->>+Product: 재고 확인 (with lock)
 Product-->>-Server: 재고 정보 반환
 Server->>+Wallet: 잔액 확인
 Wallet-->>-Server: 잔액 정보 반환
 Server->>+Order: 주문 생성
 Order-->>-Server: 주문 생성 완료
 Server->>+Product: 재고 차감
 Product-->>-Server: 재고 차감 완료
 Server->>+Wallet: 포인트 차감
 Wallet-->>-Server: 포인트 차감 완료
 Server-->>-Client: 구매 완료 응답
```

**발생 가능한 이슈:**

- 동시 구매로 인한 재고 초과 판매
- 포인트 차감 시점의 잔액 부족
- 재고 확인과 차감 간 시차로 인한 정합성 문제

**비관적 락 선택 이유:**

- 다수 사용자의 동시 구매 요청 빈번
- 재고 데이터의 정확성 중요
- 롤백 비용 최소화 필요

## 2. 성능 테스트 결과

### 2.1 포인트 충전 (50 VU, 1000 iterations)

- 성공률: 11.6%
- 평균 응답시간: 66.02ms

<details>
<summary>테스트 결과 보기</summary>
<img src="https://i.imgur.com/ZuGccLX.png" alt="charge-test-result">
</details>

### 2.2 상품 구매 (50 VU, 1000 iterations)

- 성공률: 10.17%
- 평균 응답시간: 45.4ms
- 재고 정합성: 100% 유지

<details>
<summary>테스트 결과 보기</summary>
<img src="https://i.imgur.com/mHdsTfN.png" alt="order-test-result">
</details>

## 3. 결론

프로젝트 특성을 고려한 최종 설계:

1. 포인트 충전: 낙관적 락 적용

   - 단일 사용자 접근으로 충돌 가능성 낮음
   - 성능 우선 고려
   - 충돌 시 재시도로 해결 가능

2. 상품 구매: 비관적 락 적용
   - 동시 접근이 빈번한 재고 관리
   - 데이터 정합성 우선 고려
   - 트랜잭션 롤백 비용 최소화