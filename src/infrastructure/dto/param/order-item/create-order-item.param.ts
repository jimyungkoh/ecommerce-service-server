import { OrderItemModel, OrderModel } from 'src/domain/models';

export type CreateOrderItemParamProps = {
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
};

export class CreateOrderItemParam {
  readonly orderId: number;
  readonly productId: number;
  readonly quantity: number;
  readonly price: number;

  constructor(props: CreateOrderItemParamProps) {
    this.orderId = props.orderId;
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.price = props.price;
  }

  static from(
    order: Pick<OrderModel, 'id'>,
    orderItem: Pick<OrderItemModel, 'productId' | 'quantity' | 'price'>,
  ) {
    return new CreateOrderItemParam({
      orderId: order.id,
      productId: orderItem.productId,
      quantity: orderItem.quantity,
      price: orderItem.price,
    });
  }
}
