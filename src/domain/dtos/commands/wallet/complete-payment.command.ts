export type CompletePaymentCommandProps = {
  userId: number;
  amount: number;
};

export class CompletePaymentCommand {
  readonly userId: number;
  readonly amount: number;

  constructor(props: CompletePaymentCommandProps) {
    this.userId = props.userId;
    this.amount = props.amount;
  }
}
