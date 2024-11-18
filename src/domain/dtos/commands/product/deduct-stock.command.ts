interface DeductStockCommandProps {
  orderItems: {
    [productId: number]: number;
  };
}

export class DeductStockCommand {
  readonly orderItems: {
    [productId: number]: number;
  };

  constructor(props: DeductStockCommandProps) {
    this.orderItems = props.orderItems;
  }
}
