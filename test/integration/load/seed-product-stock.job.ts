import { Effect, pipe } from 'effect';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/ko';

export default function seedProductStockJob(prisma: PrismaClient) {
  return pipe(
    Effect.tryPromise(() =>
      prisma.product.findMany({
        select: { id: true },
        orderBy: { id: 'asc' },
      }),
    ),
    Effect.map((products) =>
      products.map((product) => ({
        productId: product.id,
        stock: faker.number.int({ min: 0, max: 1000 }),
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    ),
    Effect.flatMap((stockData) =>
      Effect.tryPromise(() =>
        prisma.productStock.createMany({
          data: stockData,
          skipDuplicates: true,
        }),
      ),
    ),
  );
}
