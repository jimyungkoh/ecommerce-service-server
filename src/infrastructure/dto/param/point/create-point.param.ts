import { TransactionType } from 'src/domain/models';

export type CreatePointParamProps = {
  walletId: number;
  amount: number;
  transactionType: TransactionType;
};

export class CreatePointParam {
  readonly walletId: number;
  readonly amount: number;
  readonly transactionType: TransactionType;

  constructor(props: CreatePointParamProps) {
    this.walletId = props.walletId;
    this.amount = props.amount;
    this.transactionType = props.transactionType;
  }
}
