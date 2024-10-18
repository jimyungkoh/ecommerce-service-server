export class PopularProductDomain {
  constructor(
    readonly id: bigint,
    readonly productId: bigint,
    readonly salesCount: bigint,
    readonly aggregationDate: Date,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}
}
