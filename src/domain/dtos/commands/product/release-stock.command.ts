export class ReleaseStockCommand {
  constructor(
    public readonly productId: number,
    public readonly userId: number,
  ) {}
} 