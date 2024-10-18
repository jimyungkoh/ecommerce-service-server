export class CartItemDomain {
  constructor(
    readonly id: bigint,
    readonly cartId: number,
    readonly productId: bigint,
    readonly quantity: number,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}
}
