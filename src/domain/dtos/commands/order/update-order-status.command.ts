import { Prisma } from '@prisma/client';
import { OrderStatus } from 'src/infrastructure/dtos/domains';

export type UpdateOrderStatusCommandProps = {
  orderId: bigint;
  status: OrderStatus;
  transaction?: Prisma.TransactionClient;
};

export class UpdateOrderStatusCommand {
  constructor(private readonly props: UpdateOrderStatusCommandProps) {}

  get orderId(): bigint {
    return this.props.orderId;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get transaction(): Prisma.TransactionClient | undefined {
    return this.props.transaction;
  }
}
