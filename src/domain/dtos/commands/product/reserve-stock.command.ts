export class ReserveStockCommand {
  constructor(
    public readonly productId: number,
    public readonly userId: number,
    public readonly quantity: number,
  ) {}
} 