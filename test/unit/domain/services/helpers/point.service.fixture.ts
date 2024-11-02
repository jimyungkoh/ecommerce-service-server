import {
  PointDomain,
  TransactionType,
  WalletDomain,
} from 'src/infrastructure/dtos/domains';

export const pointServiceFixture = () => {
  const userId = 1;
  const amount = 100;
  const wallet = new WalletDomain({
    id: 1,
    userId,
    totalPoint: 0,
    version: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const point = new PointDomain({
    id: 1,
    walletId: wallet.id,
    amount,
    transactionType: TransactionType.CHARGE,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiredAt: null,
  });
  return { userId, amount, wallet, point };
};
