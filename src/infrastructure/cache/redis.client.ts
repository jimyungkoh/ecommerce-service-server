import { OnModuleDestroy } from '@nestjs/common';
import { Effect } from 'effect';
import Redis from 'ioredis';
import { CustomConfigService } from 'src/common/config';
import { Infrastructure } from 'src/common/decorators';

@Infrastructure()
export class RedisClient implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(private readonly configService: CustomConfigService) {
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
    return Effect.tryPromise(() => this.redis.get(`${prefix}:${key}`));
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
}
