import { Module } from '@nestjs/common';
import { ConfigurationModule } from 'src/common/config';
import { RedisClient } from './redis.client';
import { ProductStockCacheStore } from './stores/product-stock.cache.store';
import { ProductCacheStore } from './stores/product.cache.store';

@Module({
  imports: [ConfigurationModule],
  providers: [RedisClient, ProductCacheStore, ProductStockCacheStore],
  exports: [RedisClient, ProductCacheStore, ProductStockCacheStore],
})
export class CacheModule {}
