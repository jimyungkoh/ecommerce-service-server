import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Effect, pipe } from 'effect';
import { Application } from 'src/common/decorators';
import {
  AddCartItemCommand,
  CreateOrderCommand,
  CreateOrderInfo,
  RemoveCartItemCommand,
} from 'src/domain/dtos';
import { CreateOrderItemCommand } from 'src/domain/dtos/commands/order/create-order-item.command';
import { OutboxEventTypes } from 'src/domain/models/outbox-event.model';
import { CartService, OrderService, ProductService } from 'src/domain/services';
import { AppLogger, TransientLoggerServiceToken } from '../../common/logger';
import { CreateOrderItemDto } from '../../presentation/dtos';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ErrorCodes } from '../../common/errors';

@Application()
export class OrderFacade {
  constructor(
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prismaService: PrismaService,
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

    const emitOrderCreatedEvent = (
      order: CreateOrderInfo,
      phase: 'before_commit' | 'after_commit',
    ) =>
      pipe(
        Effect.tryPromise(
          async () =>
            await this.eventEmitter
              .emitAsync(`${OutboxEventTypes.ORDER_CREATED}.${phase}`, order)
              .catch((e) => {
                this.logger.error(e);
                throw e;
              }),
        ),
      );

    return pipe(
      createOrderItemCommands(orderItemDtos),
      Effect.flatMap((orderItems) =>
        this.prismaService.transaction(
          (tx) =>
            pipe(
              // 1. 주문 생성
              this.orderService.createOrder(
                new CreateOrderCommand({ userId, orderItems }),
                tx,
              ),
              // before_commit:  아웃박스 - 주문 - 주문 생성 저장
              Effect.tap((order) =>
                emitOrderCreatedEvent(order, 'before_commit'),
              ),
            ),
          ErrorCodes.ORDER_FAILED.message,
        ),
      ),
      // after_commit: OrderProducer - 주문 메시지 발행
      Effect.flatMap((result) =>
        pipe(
          emitOrderCreatedEvent(result, 'after_commit'),
          Effect.map(() => result),
        ),
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
