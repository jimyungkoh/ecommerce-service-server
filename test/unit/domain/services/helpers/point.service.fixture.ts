import { PointModel, TransactionType, WalletModel } from 'src/domain/models';

export const pointServiceFixture = () => {
  const userId = 1;
  const amount = 100;
  const wallet = new WalletModel({
    id: 1,
    userId,
    totalPoint: 0,
    version: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const point = new PointModel({
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
