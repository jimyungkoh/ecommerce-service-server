import { faker } from '@faker-js/faker/locale/ko';
import { PrismaClient } from '@prisma/client';
import { Effect } from 'effect';

export default function seedPopularProductJob(
  dataSetSize: number,
  prisma: PrismaClient,
) {
  const popularProductData = Array.from({
    length: 365,
  }).map((_, index) => ({
    productId: index + 1,
    salesCount: faker.number.int({ min: 1, max: 10_000 }),
    aggregationDate: new Date(
      new Date().getTime() - index * 24 * 60 * 60 * 1000,
    ),
  }));

  const effects = Array.from({ length: 25_000 }).map((_, index) => {
    const productId = index + 1;
    return Effect.tryPromise(() =>
      prisma.popularProduct.createMany({
        data: popularProductData.map((data) => ({
          ...data,
          productId,
        })),
      }),
    );
  });

  return Effect.all(effects);
}
