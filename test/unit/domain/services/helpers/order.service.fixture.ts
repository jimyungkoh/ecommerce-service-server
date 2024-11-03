import { Prisma } from '@prisma/client';
import {
  OrderItemModel,
  OrderModel,
  OrderStatus,
  UserModel,
} from 'src/domain/models';

export const orderServiceFixture = () => {
  const transaction = {} as Prisma.TransactionClient;
  const userId = 1;
  const orderId = 1;

  const user = new UserModel({
    id: userId,
    email: 'test@email.com',
    password: 'password',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const order = new OrderModel({
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

  const orderItem = new OrderItemModel({
    id: 1,
    orderId: orderId,
    productId: 1,
    quantity: 2,
    price: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const orderItemParams = {
    id: 1,
    orderId: orderId,
    productId: 1,
    quantity: 2,
    price: 100,
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
