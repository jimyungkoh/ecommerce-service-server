import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { Application } from 'src/common/decorators';
import {
  AddCartItemCommand,
  CreateOrderCommand,
  CreateOrderInfo,
  CreateOutboxEventCommand,
  RemoveCartItemCommand,
  UpdateOrderStatusCommand,
} from 'src/domain/dtos';
import { CreateOrderItemCommand } from 'src/domain/dtos/commands/order/create-order-item.command';
import { OutboxEventTypes } from 'src/domain/models/outbox-event.model';
import { CartService, OrderService, ProductService } from 'src/domain/services';
import { OutboxEventService } from 'src/domain/services/outbox-event.service';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';
import { OrderStatus } from '../../domain/models';
import { PrismaService } from '../../infrastructure/database';
import { CreateOrderItemDto } from '../../presentation/dtos';

@Application()
export class OrderFacade {
  constructor(
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
    private readonly prismaService: PrismaService,
    private readonly outboxEventService: OutboxEventService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  order(userId: number, orderItemDtos: CreateOrderItemDto[]) {
    const createOrderItemCommands = (orderItems: CreateOrderItemDto[]) =>
      Effect.all(
        orderItems.map((item) =>
          pipe(
            this.productService.getBy(item.productId),
            Effect.map((product) => new CreateOrderItemCommand(product, item)),
          ),
        ),
      );

    const createOrder = (
      orderItems: CreateOrderItemCommand[],
      tx: Prisma.TransactionClient,
    ) =>
      this.orderService.createOrder(
        new CreateOrderCommand({ userId, orderItems }),
        tx,
      );

    const createOutboxEvent = (
      order: CreateOrderInfo,
      tx: Prisma.TransactionClient,
    ) =>
      this.outboxEventService.createOutboxEvent(
        new CreateOutboxEventCommand({
          aggregateId: `order-${order.order.id}`,
          eventType: OutboxEventTypes.ORDER_CREATED,
          payload: JSON.stringify(order),
        }),
        tx,
      );

    return pipe(
      createOrderItemCommands(orderItemDtos),
      Effect.flatMap((orderItems) =>
        this.prismaService.transaction((tx) =>
          pipe(
            createOrder(orderItems, tx),
            Effect.tap((order) => createOutboxEvent(order, tx)),
          ),
        ),
      ),
    );
  }

  getOrder(userId: number, orderId: number) {
    return this.orderService.getOrder(userId, orderId);
  }

  processOrderSuccess(orderInfo: CreateOrderInfo) {
    const emitOrderSuccessEvent = () =>
      Effect.tryPromise(
        async () =>
          await this.eventEmitter.emitAsync(
            `${OutboxEventTypes.ORDER_SUCCESS}.before_commit`,
            orderInfo,
          ),
      );

    return this.prismaService.transaction((tx) =>
      pipe(
        this.orderService.updateOrderStatus(
          new UpdateOrderStatusCommand({
            orderId: orderInfo.order.id,
            status: OrderStatus.PAID,
          }),
          tx,
        ),
        Effect.tap(emitOrderSuccessEvent),
      ),
    );
  }

  getCartBy(userId: number) {
    return this.cartService.getCartBy(userId);
  }

  addCartItem(userId: number, productId: number, quantity: number) {
    const getCartByEffect = this.cartService.getCartBy(userId);

    return pipe(
      getCartByEffect,
      Effect.map(
        ({ cart }) =>
          new AddCartItemCommand({
            cartId: cart.id,

            productId,
            quantity,
          }),
      ),
      Effect.flatMap((addCartItemCommand) =>
        this.cartService.addCartItem(addCartItemCommand),
      ),
    );
  }

  removeCartItem(userId: number, productId: number) {
    return this.cartService.removeCartItem(
      new RemoveCartItemCommand({ userId, productId }),
    );
  }
}
