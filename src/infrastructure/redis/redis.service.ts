import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache, Milliseconds } from 'cache-manager';

@Injectable()
export class RedisClient {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get(key: string): Promise<string | undefined> {
    return this.cacheManager.get(key);
  }

  async set(key: string, value: string, ttl?: Milliseconds): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}
