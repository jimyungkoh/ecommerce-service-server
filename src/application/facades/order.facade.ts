import { Inject, Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import {
  AddCartItemCommand,
  CompletePaymentCommand,
  CreateOrderCommand,
  DeductStockCommand,
  RemoveCartItemCommand,
  UpdateOrderStatusCommand,
} from 'src/domain/dtos';
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
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    private readonly prismaService: PrismaService,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
    private readonly walletService: WalletService,
  ) {}

  async order(userId: number, orderItemDtos: OrderItemCreateDto[]) {
    const orderItems = await Promise.all(
      orderItemDtos.map(async (orderItem) => {
        const product = await this.productService.getBy(orderItem.productId);
        return {
          ...orderItem,
          price: product.price,
        };
      }),
    );

    try {
      return await this.prismaService.$transaction(async (transaction) => {
        // 주문 생성
        const order = await this.orderService.createOrder(
          new CreateOrderCommand({
            userId,
            orderItems: orderItems.map((item) => ({
              ...item,
              productId: BigInt(item.productId),
            })),
            transaction,
          }),
        );

        // 결제
        await this.walletService.completePayment(
          new CompletePaymentCommand({
            userId,
            amount: new Decimal(order.totalAmount),
            transaction,
          }),
        );

        // 상품 재고 감소
        await this.productService.deductStock(
          new DeductStockCommand({
            orderItems: order.orderItems.map((item) => ({
              productId: BigInt(item.productId),
              quantity: item.quantity,
            })),
            transaction,
          }),
        );

        // 결제 완료 처리
        const completeOrder = await this.orderService.updateOrderStatus(
          new UpdateOrderStatusCommand({
            orderId: BigInt(order.order.id),
            status: OrderStatus.PAID,
            transaction,
          }),
        );

        return completeOrder;
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.info(error.message, {
          props: { ...orderItemDtos },
        });
      } else {
        this.logger.error(String(error));
      }
      throw error;
    }
  }

  async getCartBy(userId: number) {
    return await this.cartService.getCartBy(userId);
  }

  async addCartItem(userId: number, productId: bigint, quantity: number) {
    const cart = await this.cartService.getCartBy(userId);

    return await this.cartService.addCartItem(
      new AddCartItemCommand({
        cartId: cart.cart.id,
        productId,
        quantity,
      }),
    );
  }

  async removeCartItem(userId: number, productId: bigint) {
    return await this.cartService.removeCartItem(
      new RemoveCartItemCommand({ userId, productId }),
    );
  }
}
