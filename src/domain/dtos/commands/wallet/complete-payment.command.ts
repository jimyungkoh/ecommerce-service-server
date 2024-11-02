import { Prisma } from '@prisma/client';

export type CompletePaymentCommandProps = {
  userId: number;
  amount: number;
  transaction: Prisma.TransactionClient;
};

export class CompletePaymentCommand {
  constructor(private readonly props: CompletePaymentCommandProps) {}

  get userId(): number {
    return this.props.userId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get transaction(): Prisma.TransactionClient {
    return this.props.transaction;
  }
}
