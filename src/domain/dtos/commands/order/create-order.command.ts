import { Prisma } from '@prisma/client';
import { OrderItemModel, OrderModel } from 'src/domain/models';

export type OrderItemData = Pick<
  OrderItemModel,
  'productId' | 'quantity' | 'price'
>;

export type CreateOrderCommandProps = {
  userId: number;
  orderItems: OrderItemData[];
  transaction: Prisma.TransactionClient;
};

export class CreateOrderCommand {
  readonly userId: number;
  readonly orderItems: OrderItemData[];
  readonly transaction: Prisma.TransactionClient;

  constructor(props: CreateOrderCommandProps) {
    this.userId = props.userId;
    this.orderItems = props.orderItems;
    this.transaction = props.transaction;
  }
}

export class OrderCreateResult {
  private readonly order: OrderModel;
}
