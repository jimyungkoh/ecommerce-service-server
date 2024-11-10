import { Prisma } from '@prisma/client';
import { OrderItemModel } from 'src/domain/models';

interface DeductStockCommandProps {
  orderItems: Pick<OrderItemModel, 'productId' | 'quantity'>[];
  transaction: Prisma.TransactionClient;
}

export class DeductStockCommand {
  readonly orderItems: Pick<OrderItemModel, 'productId' | 'quantity'>[];
  readonly transaction: Prisma.TransactionClient;

  constructor(props: DeductStockCommandProps) {
    this.orderItems = props.orderItems;
    this.transaction = props.transaction;
  }
}
