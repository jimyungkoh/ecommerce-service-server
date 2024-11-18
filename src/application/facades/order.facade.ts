import { Inject } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { Facade } from 'src/common/decorators';
import { ErrorCodes } from 'src/common/errors';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import {
  AddCartItemCommand,
  CompletePaymentCommand,
  CreateOrderCommand,
  DeductStockCommand,
  OrderItemData,
  RemoveCartItemCommand,
  UpdateOrderStatusCommand,
} from 'src/domain/dtos';
import { CreateOrderInfo } from 'src/domain/dtos/info';
import {
  AppConflictException,
  ApplicationException,
} from 'src/domain/exceptions';
import {
  CartService,
  OrderService,
  ProductService,
  WalletService,
} from 'src/domain/services';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { OrderItemCreateDto } from 'src/presentation/dtos/order-create.dto';

@Facade()
export class OrderFacade {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
    private readonly walletService: WalletService,
  ) {}

  order(userId: number, orderItemDtos: OrderItemCreateDto[]) {
    const getOrderItemsWithPrice = (orderItems: OrderItemCreateDto[]) =>
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

    const createOrderEffect = (
      orderItems: OrderItemData[],
      transaction: Prisma.TransactionClient,
    ) =>
      this.orderService.createOrder(
        new CreateOrderCommand({ userId, orderItems, transaction }),
      );

    const deductStockEffect = (
      order: CreateOrderInfo,
      transaction: Prisma.TransactionClient,
    ) =>
      this.productService.deductStock(
        new DeductStockCommand({
          orderItems: Object.fromEntries(
            order.orderItems.map(({ productId, quantity }) => [
              productId,
              quantity,
            ]),
          ),
        }),
        transaction,
      );

    const completePaymentEffect = (
      userId: number,
      order: CreateOrderInfo,
      transaction: Prisma.TransactionClient,
    ) =>
      this.walletService.completePayment(
        new CompletePaymentCommand({
          userId,
          amount: order.totalAmount(),
          transaction,
        }),
      );

    const updateOrderStatusEffect = (
      order: CreateOrderInfo,
      transaction: Prisma.TransactionClient,
    ) =>
      this.orderService.updateOrderStatus(
        new UpdateOrderStatusCommand({
          orderId: order.order.id,
          status: OrderStatus.PAID,
          transaction,
        }),
      );

    /*
    pipe(
      createOrderEffect(orderItems, transaction).pipe(
        Effect.tap((order) =>
          deductStockEffect(order, transaction).pipe(
            Effect.tap((order) =>
              completePaymentEffect(userId, order, transaction).pipe(
            Effect.catch(결재 원복),
          ),
        ),
      Effect.catch(재고 원복),
      ),
    ),
      Effect.catch(주문 원복),
    );
    */

    return pipe(
      getOrderItemsWithPrice(orderItemDtos),
      Effect.flatMap((orderItems) =>
        this.prismaService.transaction(
          (transaction) =>
            pipe(
              createOrderEffect(orderItems, transaction),
              Effect.tap((order) => deductStockEffect(order, transaction)),
              Effect.tap((order) =>
                completePaymentEffect(userId, order, transaction),
              ),
              Effect.flatMap((order) =>
                updateOrderStatusEffect(order, transaction),
              ),
            ),
          ErrorCodes.ORDER_FAILED.message,
        ),
      ),
      Effect.catchIf(
        (error) => !(error instanceof ApplicationException),
        () => Effect.fail(new AppConflictException(ErrorCodes.ORDER_FAILED)),
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
