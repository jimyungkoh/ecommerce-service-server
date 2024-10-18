export class ProductStockDomain {
  constructor(
    readonly productId: bigint,
    readonly stock: number,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  inStock(quantity: number): boolean {
    return this.stock >= quantity;
  }
}
