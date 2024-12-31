import { Effect, pipe } from 'effect';
import { Infrastructure } from 'src/common/decorators';
import { RedisClient } from '../redis.client';

@Infrastructure()
export class ProductStockCacheStore {
  private readonly TTL = 300; // 5분 (실제로는 평균 결제 시간을 계산하여 설정)
  private readonly stockPrefix = 'product-stock';
  private readonly reservationPrefix = 'product-stock-reservation';

  constructor(private readonly redisClient: RedisClient) {}

  getStock(productId: number) {
    const stock = this.redisClient.get(this.stockPrefix, `${productId}`);

    return pipe(
      stock,
      Effect.map((stock) => (stock ? Number(stock) : null)),
    );
  }

  cacheStock(productId: number, stock: number) {
    return this.redisClient.setWithExpiry(
      this.stockPrefix,
      `${productId}`,
      stock.toString(),
      this.TTL,
    );
  }

  // 재고 예약 추가
  reserveStock(productId: number, userId: number, quantity: number) {
    const now = Math.floor(Date.now() / 1000); // 현재 시간을 초 단위로 변환
    const score = now + this.TTL; // 우선순위 설정
    const productKey = productId.toString();
    const reservationId = crypto.randomUUID(); // 예약마다 고유 ID 생성

    return pipe(
      Effect.loop(1, {
        while: (seq) => seq <= quantity,
        step: (seq) => seq + 1,
        body: (seq) =>
          this.redisClient.zadd(
            this.reservationPrefix,
            productKey,
            score,
            `user:${userId}:${reservationId}:seq:${seq}`,
          ),
      }),
    );
  }

  // 현재 예약된 수량 조회
  countReservedStock(productId: number) {
    const now = Math.floor(Date.now() / 1000);
    const productKey = productId.toString();

    return pipe(
      // 만료된 예약 제거
      this.redisClient.zremrangebyscore(
        this.reservationPrefix,
        productKey,
        '-inf',
        now.toString(),
      ),
      // 현재 유효한 예약 수량 반환
      Effect.flatMap(() =>
        this.redisClient.zcount(this.reservationPrefix, productKey),
      ),
    );
  }

  // 예약 해제
  // releaseReservation(productId: number, userId: number) {
  //   const productKey = productId.toString();

  //   return pipe(
  //     // 예약 검색
  //     this.redisClient.zscan(this.PREFIX, productKey, `user:${userId}*`),
  //     // 예약 해제
  //     Effect.flatMap(([, reservationEntries]) =>
  //       Effect.if(reservationEntries.length > 0, {
  //         onTrue: () => {
  //           // reservation, score 쌍으로 반환되므로 짝수 인덱스만 필터링
  //           const reservations = reservationEntries.filter(
  //             (_, i) => i % 2 === 0,
  //           );

  //           // reservation 삭제
  //           return pipe(
  //             this.redisClient.zrem(this.PREFIX, productKey, ...reservations),
  //             Effect.map(() => Effect.succeed(void 0)),
  //           );
  //         },
  //         onFalse: () => Effect.succeed(void 0),
  //       }),
  //     ),
  //   );
  // }
}
