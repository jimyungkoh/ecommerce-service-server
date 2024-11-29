import { PrismaClient } from '@prisma/client';
import { Effect, pipe } from 'effect';
import * as process from 'node:process';
import seedPopularProductJob from './seed-popular-product.job';
import seedProductJob from './seed-product.job';
import seedUserJob from './seed-user.job';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  const startTime = new Date();

  if (!prisma) throw new Error('Prisma client is not initialized');
  // 기존 데이터 삭제
  await prisma.$executeRaw`TRUNCATE TABLE order_item`;
  await prisma.$executeRaw`TRUNCATE TABLE \`order\``;
  await prisma.$executeRaw`TRUNCATE TABLE cart_item`;
  await prisma.$executeRaw`TRUNCATE TABLE cart`;
  await prisma.$executeRaw`TRUNCATE TABLE wallet`;
  await prisma.$executeRaw`TRUNCATE TABLE point`;
  await prisma.$executeRaw`TRUNCATE TABLE product_stock`;
  await prisma.$executeRaw`TRUNCATE TABLE product`;
  await prisma.$executeRaw`TRUNCATE TABLE user`;
  await prisma.$executeRaw`TRUNCATE TABLE outbox_event`;

  await Effect.runPromise(
    pipe(
      Effect.all([
        seedProductJob(1000, prisma),
        seedUserJob(prisma),
        seedPopularProductJob(1000, prisma),
      ]),
      Effect.tap(() => Effect.tryPromise(() => prisma.$disconnect())),
    ),
  );

  const endTime = new Date();
  console.log(`소요시간: ${endTime.getTime() - startTime.getTime()}ms`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
