import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { WinstonLoggerService } from 'src/common/logger';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { OrderItemCreateDto } from 'src/presentation/dto/order-create.dto';
import {
  CartService,
  OrderService,
  ProductService,
  WalletService,
} from '../services';

// port : interface; adapter : 구현체(class)
@Injectable()
export class OrderFacade {
  constructor(
    private readonly logger: WinstonLoggerService,
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
          userId,
          orderItems,
          transaction,
        );
        this.logger.log('order created');
        // 결제
        await this.walletService.completePayment(
          userId,
          order.totalAmount,
          transaction,
        );
        this.logger.log('payment');

        // 상품 재고 감소
        await this.productService.deductStock(order.orderItems, transaction);
        this.logger.log('stock deducted');

        // 결제 완료 처리
        const completeOrder = await this.orderService.updateOrderStatus(
          order.id,
          OrderStatus.PAID,
          transaction,
        );
        this.logger.log('order status paid');

        return completeOrder;
      });
    } catch (error) {
      this.logger.error((error as Error)?.message);
      throw error;
    }
  }

  async getCartBy(userId: number) {
    return await this.cartService.getCartBy(userId);
  }

  async addCartItem(userId: number, productId: bigint, quantity: number) {
    const cart = await this.cartService.getCartBy(userId);

    return await this.cartService.addCartItem(cart, productId, quantity);
  }

  async removeCartItem(userId: number, productId: number) {
    return await this.cartService.removeCartItem(userId, productId);
  }
}
