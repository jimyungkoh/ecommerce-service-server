export class UpdateWalletPointParam {
  readonly id: number;
  readonly amount: number;
  readonly version: number;

  constructor(params: UpdateWalletPointParam) {
    this.id = params.id;
    this.amount = params.amount;
    this.version = params.version;
  }

  static from(wallet: { id: number; totalPoint: number; version: number }) {
    return new UpdateWalletPointParam({
      id: wallet.id,
      amount: wallet.totalPoint,
      version: wallet.version,
    });
  }
}
