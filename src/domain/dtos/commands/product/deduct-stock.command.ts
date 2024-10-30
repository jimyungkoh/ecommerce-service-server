import { Prisma } from '@prisma/client';
import { OrderItemDomain } from 'src/infrastructure/dtos/domains';

interface DeductStockCommandProps {
  orderItems: Pick<OrderItemDomain, 'productId' | 'quantity'>[];
  transaction: Prisma.TransactionClient;
}

export class DeductStockCommand {
  constructor(private readonly props: DeductStockCommandProps) {}

  get orderItems(): Pick<OrderItemDomain, 'productId' | 'quantity'>[] {
    return this.props.orderItems;
  }

  get transaction(): Prisma.TransactionClient {
    return this.props.transaction;
  }
}
