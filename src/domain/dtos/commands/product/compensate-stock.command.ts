export class CompensateStockCommand {
  constructor(readonly orderItems: { productId: number; quantity: number }[]) {}
}
