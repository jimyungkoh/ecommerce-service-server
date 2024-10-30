import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import {
  PointDomain,
  TransactionType,
  WalletDomain,
} from 'src/infrastructure/dtos/domains';

export const walletServiceFixture = () => {
  const transaction = {} as Prisma.TransactionClient;
  const largeAmount = new Decimal(100_000);

  const wallet = new WalletDomain({
    id: 1,
    userId: 1,
    totalPoint: new Decimal(100),
    version: BigInt(1),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const point = new PointDomain({
    id: BigInt(1),
    walletId: wallet.id,
    amount: new Decimal(50),
    transactionType: TransactionType.PURCHASE,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiredAt: null,
  });

  const updatedWallet = new WalletDomain({
    id: 1,
    userId: 1,
    totalPoint: new Decimal(50),
    version: BigInt(1),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { transaction, wallet, point, updatedWallet, largeAmount };
};
