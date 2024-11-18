import { Prisma } from '@prisma/client';
import { OrderStatus } from 'src/domain/models';

export type UpdateOrderStatusCommandProps = {
  orderId: number;
  status: OrderStatus;
  transaction?: Prisma.TransactionClient;
};

export class UpdateOrderStatusCommand {
  readonly orderId: number;
  readonly status: OrderStatus;
  readonly transaction?: Prisma.TransactionClient;

  constructor(props: UpdateOrderStatusCommandProps) {
    this.orderId = props.orderId;
    this.status = props.status;
    this.transaction = props.transaction;
  }
}
