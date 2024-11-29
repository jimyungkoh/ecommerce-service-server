import { OrderStatus } from 'src/domain/models';

export type UpdateOrderStatusCommandProps = {
  orderId: number;
  status: OrderStatus;
};

export class UpdateOrderStatusCommand {
  readonly orderId: number;
  readonly status: OrderStatus;

  constructor(props: UpdateOrderStatusCommandProps) {
    this.orderId = props.orderId;
    this.status = props.status;
  }
}
