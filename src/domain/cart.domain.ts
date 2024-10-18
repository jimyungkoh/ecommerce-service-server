export class CartDomain {
  constructor(
    readonly id: number,
    readonly userId: number,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}
}
