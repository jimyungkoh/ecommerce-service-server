import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get(key: string): Promise<string | undefined> {
    return this.cacheManager.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.cacheManager.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}
