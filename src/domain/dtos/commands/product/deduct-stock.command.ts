import { Prisma } from '@prisma/client';
import { OrderItemModel } from 'src/domain/models';

interface DeductStockCommandProps {
  orderItems: Pick<OrderItemModel, 'productId' | 'quantity'>[];
  transaction: Prisma.TransactionClient;
}

export class DeductStockCommand {
  constructor(private readonly props: DeductStockCommandProps) {}

  get orderItems(): Pick<OrderItemModel, 'productId' | 'quantity'>[] {
    return this.props.orderItems;
  }

  get transaction(): Prisma.TransactionClient {
    return this.props.transaction;
  }
}
