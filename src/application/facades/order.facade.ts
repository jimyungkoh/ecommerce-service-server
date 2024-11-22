import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Effect, pipe } from 'effect';
import { Application } from 'src/common/decorators';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import {
  AddCartItemCommand,
  CreateOrderCommand,
  OrderItemData,
  RemoveCartItemCommand,
} from 'src/domain/dtos';
import { OutboxEventTypes } from 'src/domain/models/outbox-event.model';
import {
  CartService,
  OrderService,
  ProductService,
  WalletService,
} from 'src/domain/services';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { OutboxEventRepository } from 'src/infrastructure/database/repositories/outbox-event.repository';
import { CreateOrderItemDto } from '../../presentation/dtos/order/request/create-order-request.dto';

@Application()
export class OrderFacade {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
    private readonly walletService: WalletService,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  order(userId: number, orderItemDtos: CreateOrderItemDto[]) {
    const getOrderItemsWithPrice = (orderItems: CreateOrderItemDto[]) =>
      Effect.all(
        orderItems.map((item) =>
          pipe(
            this.productService.getBy(item.productId),
            Effect.map((product) => ({
              productId: item.productId,
              price: product.price,
              quantity: item.quantity,
            })),
          ),
        ),
      );

    const createOrderEffect = (orderItems: OrderItemData[]) =>
      this.orderService.createOrder(
        new CreateOrderCommand({ userId, orderItems }),
      );

    return pipe(
      getOrderItemsWithPrice(orderItemDtos),
      Effect.flatMap((orderItems) => createOrderEffect(orderItems)),
      Effect.tap((order) =>
        this.eventEmitter.emit(OutboxEventTypes.ORDER_CREATED, order),
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
