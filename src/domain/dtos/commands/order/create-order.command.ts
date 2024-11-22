import { OrderItemModel, OrderModel } from 'src/domain/models';

export type OrderItemData = Pick<
  OrderItemModel,
  'productId' | 'quantity' | 'price'
>;

export type CreateOrderCommandProps = {
  userId: number;
  orderItems: OrderItemData[];
};

export class CreateOrderCommand {
  readonly userId: number;
  readonly orderItems: OrderItemData[];

  constructor(props: CreateOrderCommandProps) {
    this.userId = props.userId;
    this.orderItems = props.orderItems;
  }
}

export class OrderCreateResult {
  private readonly order: OrderModel;
}
