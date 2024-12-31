import { Inject } from '@nestjs/common';
import { Effect, pipe } from 'effect';
import { Infrastructure } from 'src/common/decorators';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { ProductInfo } from 'src/domain/dtos';
import { ProductModel } from 'src/domain/models';
import { RedisClient } from '../redis.client';

@Infrastructure()
export class ProductCacheStore {
  productCacheTtl = 60 * 60 * 24;

  constructor(
    private readonly redisClient: RedisClient,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  cache(data: ProductModel): Effect.Effect<void, Error> {
    return pipe(
      this.redisClient.setWithExpiry(
        'product',
        data.id.toString(),
        JSON.stringify(data),
        this.productCacheTtl,
      ),
    );
  }

  findBy(productId: number): Effect.Effect<ProductModel | null, Error> {
    const parseCachedProduct = (cachedProduct: string) =>
      pipe(
        cachedProduct,
        JSON.parse,
        Effect.succeed,
        Effect.map(ProductInfo.from),
      );

    return pipe(
      this.redisClient.get('product', productId.toString()),
      Effect.flatMap((cachedProduct) =>
        cachedProduct
          ? parseCachedProduct(cachedProduct)
          : Effect.succeed(null),
      ),
      Effect.tapError((error) =>
        Effect.sync(() => this.logger.error(JSON.stringify(error))),
      ),
    );
  }
}
