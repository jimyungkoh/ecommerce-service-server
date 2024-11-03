import { Prisma } from '@prisma/client';
import { OrderItemModel, OrderModel } from 'src/domain/models';

export type CreateOrderCommandProps = {
  userId: number;
  orderItems: Pick<OrderItemModel, 'productId' | 'quantity' | 'price'>[];
  transaction: Prisma.TransactionClient;
};

export class CreateOrderCommand {
  constructor(private readonly props: CreateOrderCommandProps) {}

  get userId(): number {
    return this.props.userId;
  }

  get orderItems(): Pick<OrderItemModel, 'productId' | 'quantity' | 'price'>[] {
    return this.props.orderItems;
  }

  //TODO: 이거 왜 있는지 모르겠음 -> 의견없음 -> 인프라 의존적인 게 왜 들어감 ㅇㅋㅇㅋ -> gotit -> 그러므로 수정한다
  // 근데? 어차피 그 커링도 보상 트랜잭션 들어가면 다 걷어내야 하잖아 ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ,,,,
  // 아 맞네 그러므로 transaction 을 없앤다. -> optional로 받든가~
  //  ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ 아 내가 좀 진도가 빨랐으면 얘끼 많이 해봤을텐 -> 일단 좀 쉬로 감
  get transaction(): Prisma.TransactionClient {
    return this.props.transaction;
  }
}

export class OrderCreateResult {
  private readonly order: OrderModel;
}
