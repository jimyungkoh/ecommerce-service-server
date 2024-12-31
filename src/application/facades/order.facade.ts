import { Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { Application } from 'src/common/decorators';
import {
  AddCartItemCommand,
  CreateOrderCommand,
  CreateOrderInfo,
  CreateOutboxEventCommand,
  RemoveCartItemCommand,
  ReserveStockCommand,
  UpdateOrderStatusCommand,
} from 'src/domain/dtos';
import { CreateOrderItemCommand } from 'src/domain/dtos/commands/order/create-order-item.command';
import { AppBadRequestException } from 'src/domain/exceptions';
import { OutboxEventTypes } from 'src/domain/models/outbox-event.model';
import {
  CartService,
  OrderService,
  ProductService,
  WalletService,
} from 'src/domain/services';
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
    private readonly walletService: WalletService,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
  ) {}

  order(userId: number, orderItemDtos: CreateOrderItemDto[]) {
    /*
      1. Redis 재고 확인
      2. 재고 < 결제중 상품 수량 - 결제하려는 상품 수량 : 일시 품절 메시지
      3. 재고 >= 결제중 상품 수량 - 결제하려는 상품 수량
        3-1. 결제중 상품 수량 업데이트
        3-2. 주문 생성
    */
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
      pipe(
        this.outboxEventService.createOutboxEvent(
          new CreateOutboxEventCommand({
            aggregateId: `order-${order.order.id}`,
            eventType: OutboxEventTypes.ORDER_CREATED,
            payload: JSON.stringify(order),
          }),
          tx,
        ),
        Effect.map(() => order),
      );

    const reserveStock = (orderItems: CreateOrderItemDto[]) =>
      Effect.all(
        orderItems.map((orderItem) =>
          this.productService.reserveStock(
            new ReserveStockCommand(
              orderItem.productId,
              userId,
              orderItem.quantity,
            ),
          ),
        ),
      );

    return pipe(
      reserveStock(orderItemDtos),
      Effect.flatMap(() => createOrderItemCommands(orderItemDtos)),
      Effect.flatMap((orderItems) =>
        this.prismaService.transaction(
          (tx) =>
            pipe(
              createOrder(orderItems, tx),
              Effect.flatMap((order) => createOutboxEvent(order, tx)),
            ),
          {
            maxWait: 5_000,
            timeout: 3_000,
          },
        ),
      ),
      Effect.catchIf(
        (error) => error instanceof AppBadRequestException,
        () => Effect.succeed('일시 품절'),
      ),
    );
  }

  getOrder(userId: number, orderId: number) {
    return this.orderService.getOrder(userId, orderId);
  }

  processOrderSuccess(orderInfo: CreateOrderInfo) {
    const orderSuccessEvent = (tx: Prisma.TransactionClient) =>
      this.outboxEventService.createOutboxEvent(
        new CreateOutboxEventCommand({
          aggregateId: `order-${orderInfo.order.id}`,
          eventType: OutboxEventTypes.ORDER_SUCCESS,
          payload: JSON.stringify(orderInfo),
        }),
        tx,
      );

    return this.prismaService.transaction(
      (tx) =>
        pipe(
          this.orderService.updateOrderStatus(
            new UpdateOrderStatusCommand({
              orderId: orderInfo.order.id,
              status: OrderStatus.PAID,
            }),
            tx,
          ),
          Effect.tap(() => orderSuccessEvent(tx)),
        ),
      {
        maxWait: 10_000,
        timeout: 3_000,
      },
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
