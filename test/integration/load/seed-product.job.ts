import { faker } from '@faker-js/faker/locale/ko';
import { PrismaClient } from '@prisma/client';
import { Effect, pipe } from 'effect';

export default function seedProductWithStockJob(
  dataSetSize: number,
  prisma: PrismaClient,
) {
  const CHUNK_SIZE = 40_000;
  const BATCH_SIZE = 200_000;

  const randomDate = () => {
    const createdAt = faker.date.between({
      from: '2010-01-01',
      to: new Date(),
    });

    const updatedAt = faker.date.between({
      from: createdAt,
      to: new Date(),
    });

    return { createdAt, updatedAt };
  };

  return pipe(
    Effect.succeed(dataSetSize),
    Effect.map((size) =>
      Array.from({ length: Math.ceil(size / BATCH_SIZE) }).map(
        (_, batchIndex) => {
          const batchSize = Math.min(
            BATCH_SIZE,
            size - batchIndex * BATCH_SIZE,
          );

          return Effect.forEach(
            Array.from({ length: Math.ceil(batchSize / CHUNK_SIZE) }),
            (_, chunkIndex) =>
              Effect.tryPromise(async () => {
                const chunkSize = Math.min(
                  CHUNK_SIZE,
                  batchSize - chunkIndex * CHUNK_SIZE,
                );

                const date = randomDate();

                const productData = Array.from({ length: chunkSize }).map(
                  () => ({
                    name: faker.commerce.productName(),
                    price: faker.number.int({ min: 10, max: 100_000 }) * 100,
                    ...date,
                  }),
                );

                const products = await prisma.product.createMany({
                  data: productData,
                });

                const stockData = Array.from({ length: chunkSize }).map(
                  (_, index) => ({
                    productId: BigInt(
                      batchIndex * BATCH_SIZE +
                        chunkIndex * CHUNK_SIZE +
                        index +
                        1,
                    ),
                    stock: faker.number.int({ min: 0, max: 1000 }),
                    ...date,
                  }),
                );

                await prisma.productStock.createMany({ data: stockData });

                return products;
              }),
          );
        },
      ),
    ),
    Effect.flatMap(Effect.all),
  );
}
