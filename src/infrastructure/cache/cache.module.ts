import { Module } from '@nestjs/common';
import { ConfigurationModule } from 'src/common/config';
import { RedisClient } from './redis.client';
import { ProductCacheStore } from './stores/product.cache.store';

@Module({
  imports: [ConfigurationModule],
  providers: [RedisClient, ProductCacheStore],
  exports: [RedisClient, ProductCacheStore],
})
export class CacheModule {}
