import { OrderItemModel, OrderItemModelProps } from 'src/domain/models';
import { InfoDTO } from '../info';

export type OrderItemInfoProps = OrderItemModelProps;

export class OrderItemInfo extends InfoDTO<OrderItemInfoProps> {
  constructor(props: OrderItemInfoProps) {
    super(props);
  }

  get id(): number {
    return this.props.id;
  }

  get orderId(): number {
    return this.props.orderId;
  }

  get productId(): number {
    return this.props.productId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get price(): number {
    return this.props.price;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static from(domain: OrderItemModel): OrderItemInfo {
    return new OrderItemInfo(domain);
  }
}
