import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Effect, pipe } from 'effect';
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
import { OrderStatus } from 'src/domain/models';
import {
  CartService,
  OrderService,
  ProductService,
  WalletService,
} from 'src/domain/services';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { OrderItemCreateDto } from 'src/presentation/dtos/order-create.dto';

@Injectable()
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
    const fetchOrderItemsWithPrice = (orderItems: OrderItemCreateDto[]) =>
      Effect.all(
        orderItems.map((item) =>
          this.productService.getBy(item.productId).pipe(
            Effect.map((product) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: product.price,
            })),
          ),
        ),
      );

    // 트랜잭션 시작
    const orderEffect = (
      orderItems: OrderItemData[],
      transaction: Prisma.TransactionClient,
    ) =>
      this.orderService.createOrder(
        new CreateOrderCommand({
          userId,
          orderItems,
          transaction,
        }),
      );

    // 재고 차감
    const deductStockEffect = (
      order: CreateOrderInfo,
      transaction: Prisma.TransactionClient,
    ) =>
      this.productService.deductStock(
        new DeductStockCommand({
          orderItems: order.orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          transaction,
        }),
      );

    // 결제 완료 처리
    const completePaymentEffect = (
      order: CreateOrderInfo,
      transaction: Prisma.TransactionClient,
    ) =>
      this.walletService.completePayment(
        new CompletePaymentCommand({
          userId,
          amount: order.totalAmount,
          transaction,
        }),
      );

    // 주문 상태 업데이트
    const updatedOrderEffect = (
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

    const handleOrderProcessing = (orderItems: OrderItemData[]) => {
      return Effect.tryPromise(() =>
        this.prismaService.$transaction(async (transaction) => {
          // 트랜잭션 커밋
          const order = pipe(
            orderEffect(orderItems, transaction),
            Effect.flatMap((order) =>
              pipe(
                deductStockEffect(order, transaction),
                Effect.flatMap(() => completePaymentEffect(order, transaction)),
                Effect.flatMap(() => updatedOrderEffect(order, transaction)),
              ),
            ),
          );

          return order;
        }),
      );
    };

    return pipe(
      fetchOrderItemsWithPrice(orderItemDtos),
      Effect.flatMap(handleOrderProcessing),
      Effect.catchIf(
        (e) => !(e instanceof ApplicationException),
        (e) => {
          this.logger.error(`주문 실패: ${JSON.stringify(e)}`);
          return Effect.fail(new AppConflictException(ErrorCodes.ORDER_FAILED));
        },
      ),
    );
  }

  getCartBy(userId: number) {
    return this.cartService.getCartBy(userId);
  }

  addCartItem(userId: number, productId: number, quantity: number) {
    const getCartByEffect = this.cartService.getCartBy(userId).pipe(
      Effect.map(
        ({ cart }) =>
          new AddCartItemCommand({
            cartId: cart.id,
            productId,
            quantity,
          }),
      ),
    );

    return pipe(
      getCartByEffect,
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
