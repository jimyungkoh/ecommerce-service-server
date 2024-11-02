import { Prisma } from '@prisma/client';
import {
  PointDomain,
  TransactionType,
  WalletDomain,
} from 'src/infrastructure/dtos/domains';

export const walletServiceFixture = () => {
  const transaction = {} as Prisma.TransactionClient;
  const largeAmount = 100_000;

  const wallet = new WalletDomain({
    id: 1,
    userId: 1,
    totalPoint: 100,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const point = new PointDomain({
    id: 1,
    walletId: wallet.id,
    amount: 50,
    transactionType: TransactionType.PURCHASE,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiredAt: null,
  });

  const updatedWallet = new WalletDomain({
    id: 1,
    userId: 1,
    totalPoint: 50,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { transaction, wallet, point, updatedWallet, largeAmount };
};
