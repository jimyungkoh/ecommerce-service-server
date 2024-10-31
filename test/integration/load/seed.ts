import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

const salt = Number(process.env.SALT_ROUNDS);

async function main() {
  // 기존 데이터 삭제
  await prisma.$executeRaw`TRUNCATE TABLE 
    "order_item",
    "order",
    "cart_item",
    "cart",
    "wallet",
    "product_stock",
    "product",
    "user"
    RESTART IDENTITY;`;

  // 1. 테스트 유저 생성
  for (let i = 0; i < 50; i++) {
    const user = await prisma.user.create({
      data: {
        email: `test${i}@example.com`,
        password: bcrypt.hashSync('test1234', salt),
      },
    });

    // 2. 유저의 지갑 생성
    const wallet = await prisma.wallet.create({
      data: {
        userId: user.id,
        totalPoint: 1_000_000, // 100만 포인트
      },
    });

    // 3. 초기 포인트 충전 이력 생성
    await prisma.point.create({
      data: {
        walletId: wallet.id,
        amount: 1_000_000,
        transactionType: 'CHARGE',
      },
    });

    await prisma.cart.create({
      data: {
        userId: user.id,
      },
    });
  }

  // 4. 상품 및 재고 데이터 생성
  const products = [
    { name: '맥북 프로 16인치', price: 3_600_000 },
    { name: '아이패드 프로', price: 1_200_000 },
    { name: '애플워치', price: 600_000 },
    { name: '에어팟 프로', price: 350_000 },
    { name: '아이폰 15 프로', price: 1_500_000 },
  ];

  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData,
    });

    await prisma.productStock.create({
      data: {
        productId: product.id,
        stock: 1_000, // 각 상품 100개씩 재고
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
