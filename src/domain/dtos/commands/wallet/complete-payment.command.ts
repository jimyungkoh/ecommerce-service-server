import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

export type CompletePaymentCommandProps = {
  userId: number;
  amount: Decimal;
  transaction: Prisma.TransactionClient;
};

export class CompletePaymentCommand {
  constructor(private readonly props: CompletePaymentCommandProps) {}

  get userId(): number {
    return this.props.userId;
  }

  get amount(): Decimal {
    return this.props.amount;
  }

  get transaction(): Prisma.TransactionClient {
    return this.props.transaction;
  }
}
