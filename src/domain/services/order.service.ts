import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { Domain } from 'src/common/decorators';
import { ErrorCodes } from 'src/common/errors';
import {
  CreateOrderCommand,
  UpdateOrderStatusCommand,
} from 'src/domain/dtos/commands';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { UserRepository } from 'src/infrastructure/database/repositories';
import { OrderItemRepository } from 'src/infrastructure/database/repositories/order-item.repository';
import { OrderRepository } from 'src/infrastructure/database/repositories/order.repository';
import { OutboxEventRepository } from 'src/infrastructure/database/repositories/outbox-event.repository';
import { CreateOrderItemParam } from 'src/infrastructure/dto/param/order-item/create-order-item.param';
import { CreateOrderOutboxEventCommand } from '../dtos/commands/outbox-event/order/create-order-outbox-event.command';
import { CreateOrderInfo, OrderInfo, OutboxEventInfo } from '../dtos/info';
import { AppNotFoundException } from '../exceptions';
import { OrderModel } from '../models';
import { OutboxEventStatus } from '../models/outbox-event.model';

@Domain()
export class OrderService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly prismaService: PrismaService,
    private readonly outboxEventRepository: OutboxEventRepository,
  ) {}
  createOrder(command: CreateOrderCommand) {
    const createOrder = (
      command: CreateOrderCommand,
      transaction: Prisma.TransactionClient,
    ) =>
      this.orderRepository.create(
        {
          userId: command.userId,
        },
        transaction,
      );

    const createOrderItems = (
      order: OrderModel,
      command: CreateOrderCommand,
      transaction: Prisma.TransactionClient,
    ) =>
      pipe(
        command.orderItems.map((orderItem) =>
          this.orderItemRepository.create(
            CreateOrderItemParam.from(order, orderItem),
            transaction,
          ),
        ),
        Effect.all,
        Effect.map((orderItems) => CreateOrderInfo.from(order, orderItems)),
      );

    return pipe(
      this.userRepository.getById(command.userId),
      Effect.flatMap(() =>
        this.prismaService.transaction(
          (transaction) =>
            pipe(
              createOrder(command, transaction),
              Effect.flatMap((order) =>
                createOrderItems(order, command, transaction),
              ),
              Effect.flatMap((info) =>
                Effect.gen(this, function* () {
                  const outboxEvent = yield* this.outboxEventRepository.create(
                    CreateOrderOutboxEventCommand.from(info.order),
                  );

                  return {
                    info,
                    outboxEvent,
                  };
                }),
              ),
            ),
          ErrorCodes.ORDER_FAILED.message,
        ),
      ),
      Effect.flatMap(({ info, outboxEvent }) =>
        pipe(
          this.outboxEventRepository.updateByAggregateIdAndEventType(
            `order-${outboxEvent.aggregateId}`,
            outboxEvent.eventType,
            {
              status: OutboxEventStatus.SUCCESS,
            },
          ),
          Effect.flatMap((outboxEvent) =>
            Effect.succeed({
              info,
              outboxEvent: OutboxEventInfo.from(outboxEvent),
            }),
          ),
        ),
      ),
      Effect.catchAll((e) => Effect.fail(e)),
    );
  }

  updateOrderStatus(
    command: UpdateOrderStatusCommand,
  ): Effect.Effect<OrderInfo, Error | AppNotFoundException> {
    return pipe(
      this.orderRepository.getById(command.orderId, command.transaction),
      Effect.flatMap((order) =>
        this.orderRepository.update(
          order.id,
          { status: command.status },
          command.transaction,
        ),
      ),
      Effect.map(OrderInfo.from),
      Effect.catchAll((e) => Effect.fail(e)),
    );
  }
}
