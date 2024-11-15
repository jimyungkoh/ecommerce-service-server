import { PrismaClient, User, Wallet } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Effect, pipe } from 'effect';

const salt = Number(process.env.SALT_ROUNDS);

export default function seedUserJob(prisma: PrismaClient) {
  const effects: Effect.Effect<unknown, unknown, never>[] = [];

  // 1. 테스트 유저 생성
  for (let i = 0; i < 50; i++) {
    const createUser = Effect.tryPromise(() =>
      prisma.user.create({
        data: {
          email: `test${i}@example.com`,
          password: bcrypt.hashSync('test1234', salt),
        },
      }),
    );

    // 2. 유저의 지갑 생성
    const createWallet = (user: User) =>
      Effect.tryPromise(() =>
        prisma.wallet.create({
          data: {
            userId: user.id,
            totalPoint: 100_000_000, // 1억 포인트
          },
        }),
      );

    // 3. 초기 포인트 충전 이력 생성
    const createPoint = (wallet: Wallet) =>
      Effect.tryPromise(() =>
        prisma.point.create({
          data: {
            walletId: wallet.id,
            amount: 1_000_000, // 100만 포인트
            transactionType: 'CHARGE',
          },
        }),
      );

    // 4. 장바구니 생성
    const createCart = (user: User) =>
      Effect.tryPromise(() =>
        prisma.cart.create({
          data: {
            userId: user.id,
          },
        }),
      );

    effects.push(
      pipe(
        createUser,
        Effect.tap(createCart),
        Effect.flatMap(createWallet),
        Effect.flatMap(createPoint),
      ),
    );
  }

  return Effect.all(effects);
}
