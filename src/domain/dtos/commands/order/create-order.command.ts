import { Prisma } from '@prisma/client';
import { OrderItemModel, OrderModel } from 'src/domain/models';

export type CreateOrderCommandProps = {
  userId: number;
  orderItems: Pick<OrderItemModel, 'productId' | 'quantity' | 'price'>[];
  transaction: Prisma.TransactionClient;
};

export class CreateOrderCommand {
  constructor(private readonly props: CreateOrderCommandProps) {}

  get userId(): number {
    return this.props.userId;
  }

  get orderItems(): Pick<OrderItemModel, 'productId' | 'quantity' | 'price'>[] {
    return this.props.orderItems;
  }

  get transaction(): Prisma.TransactionClient {
    return this.props.transaction;
  }
}

export class OrderCreateResult {
  private readonly order: OrderModel;
}
