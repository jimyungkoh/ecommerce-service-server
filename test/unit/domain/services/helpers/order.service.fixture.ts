import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import {
  OrderDomain,
  OrderItemDomain,
  OrderStatus,
  UserDomain,
} from 'src/infrastructure/dtos/domains';

export const orderServiceFixture = () => {
  const transaction = {} as Prisma.TransactionClient;
  const userId = 1;
  const orderId = BigInt(1);

  const user = new UserDomain({
    id: userId,
    email: 'test@email.com',
    password: 'password',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const order = new OrderDomain({
    id: orderId,
    userId: userId,
    status: OrderStatus.PENDING_PAYMENT,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const orderParams = {
    id: orderId,
    userId: userId,
    status: OrderStatus.PENDING_PAYMENT,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const orderItem = new OrderItemDomain({
    id: BigInt(1),
    orderId: orderId,
    productId: BigInt(1),
    quantity: 2,
    price: new Decimal(100),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const orderItemParams = {
    id: BigInt(1),
    orderId: orderId,
    productId: BigInt(1),
    quantity: 2,
    price: new Decimal(100),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    transaction,
    userId,
    orderId,
    user,
    order,
    orderItem,
    orderParams,
    orderItemParams,
  };
};
