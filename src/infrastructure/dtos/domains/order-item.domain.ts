import Decimal from 'decimal.js';

export type OrderItemDomainProps = {
  id: bigint;
  orderId: bigint;
  productId: bigint;
  quantity: number;
  price: Decimal;
  createdAt: Date;
  updatedAt: Date;
};

export class OrderItemDomain {
  constructor(private readonly props: OrderItemDomainProps) {}

  get id(): bigint {
    return this.props.id;
  }

  get orderId(): bigint {
    return this.props.orderId;
  }

  get productId(): bigint {
    return this.props.productId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get price(): Decimal {
    return this.props.price;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
