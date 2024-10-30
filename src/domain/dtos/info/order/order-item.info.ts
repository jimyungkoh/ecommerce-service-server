import {
  OrderItemDomain,
  OrderItemDomainProps,
} from 'src/infrastructure/dtos/domains';

export type OrderItemInfoProps = OrderItemDomainProps;

export class OrderItemInfo {
  constructor(private readonly props: OrderItemInfoProps) {}

  get id(): string {
    return this.props.id.toString();
  }

  get orderId(): string {
    return this.props.orderId.toString();
  }

  get productId(): string {
    return this.props.productId.toString();
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get price(): string {
    return this.props.price.toString();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static from(domain: OrderItemDomain): OrderItemInfo {
    return new OrderItemInfo(domain);
  }
}
