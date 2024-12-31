import { Inject, OnModuleDestroy } from '@nestjs/common';
import { Effect } from 'effect';
import Redis from 'ioredis';
import { CustomConfigService } from 'src/common/config';
import { Infrastructure } from 'src/common/decorators';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';

@Infrastructure()
export class RedisClient implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    private readonly configService: CustomConfigService,
  ) {
    this.redis = new Redis({
      host: this.configService.getOrThrow('REDIS_HOST'),
      port: this.configService.getOrThrow('REDIS_PORT'),
      password: this.configService.getOrThrow('REDIS_PASSWORD'),
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  get(prefix: string, key: string) {
    return Effect.tryPromise(() => this.redis.get(`${prefix}:${key}`)).pipe(
      Effect.catchAll((e) => {
        this.logger.error(`${prefix}:${key} - ${JSON.stringify(e)}`);
        return Effect.succeed(null);
      }),
    );
  }

  set(prefix: string, key: string, value: string) {
    return Effect.tryPromise(() => this.redis.set(`${prefix}:${key}`, value));
  }

  delete(prefix: string, key: string) {
    return Effect.tryPromise(() => this.redis.del(`${prefix}:${key}`));
  }

  setWithExpiry(prefix: string, key: string, value: string, expiry: number) {
    return Effect.tryPromise(() =>
      this.redis.set(`${prefix}:${key}`, value, 'EX', expiry),
    );
  }

  zadd(prefix: string, key: string, score: number | string, value: string) {
    return Effect.tryPromise(() =>
      this.redis.zadd(`${prefix}:${key}`, score, value),
    );
  }

  // 전체 멤버 수 카운트
  zcount(prefix: string, key: string) {
    return Effect.tryPromise(() =>
      this.redis.zcount(`${prefix}:${key}`, '-inf', '+inf'),
    );
  }

  // 점수 범위 삭제
  zremrangebyscore(
    prefix: string,
    key: string,
    min: number | string,
    max: number | string,
  ) {
    return Effect.tryPromise(() =>
      this.redis.zremrangebyscore(`${prefix}:${key}`, min, max),
    );
  }

  // 패턴 매칭 스캔
  zscan(prefix: string, key: string, pattern: string) {
    return Effect.tryPromise(() =>
      this.redis.zscan(`${prefix}:${key}`, 0, 'MATCH', pattern),
    );
  }

  // 멤버 삭제
  zrem(prefix: string, key: string, ...members: string[]) {
    return Effect.tryPromise(() =>
      this.redis.zrem(`${prefix}:${key}`, ...members),
    );
  }
}
