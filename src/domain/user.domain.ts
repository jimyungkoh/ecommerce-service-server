export class UserDomain {
  constructor(
    readonly id: number,
    readonly email: string,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}
}
