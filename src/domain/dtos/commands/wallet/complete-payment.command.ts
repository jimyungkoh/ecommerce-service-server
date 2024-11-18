import { Prisma } from '@prisma/client';

export type CompletePaymentCommandProps = {
  userId: number;
  amount: number;
  transaction: Prisma.TransactionClient;
};

export class CompletePaymentCommand {
  readonly userId: number;
  readonly amount: number;
  readonly transaction: Prisma.TransactionClient;

  constructor(props: CompletePaymentCommandProps) {
    this.userId = props.userId;
    this.amount = props.amount;
    this.transaction = props.transaction;
  }
}
