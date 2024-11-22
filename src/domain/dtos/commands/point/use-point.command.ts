export class UsePointCommand {
  readonly userId: number;
  readonly amount: number;
  readonly aggregateId: string;

  constructor(props: UsePointCommand) {
    this.userId = props.userId;
    this.amount = props.amount;
    this.aggregateId = props.aggregateId;
  }

  static from(data: { userId: number; amount: number; aggregateId: string }) {
    return new UsePointCommand(data);
  }
}
