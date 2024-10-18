import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { OrderItemCreateDto } from 'src/presentation/dto/order-create.dto';
import { OrderFailedException } from '../exceptions/order-failed.exception';
import {
  CartService,
  OrderService,
  ProductService,
  WalletService,
} from '../services';

@Injectable()
export class OrderUseCase {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cartManager: CartService,
    private readonly orderManager: OrderService,
    private readonly productManager: ProductService,
    private readonly walletManager: WalletService,
  ) {}

  async order(userId: number, orderItemDtos: OrderItemCreateDto[]) {
    const orderItems = await Promise.all(
      orderItemDtos.map(async (orderItem) => {
        const product = await this.productManager.getBy(orderItem.productId);
        return {
          ...orderItem,
          price: product.price,
        };
      }),
    );

    try {
      return await this.prismaService.$transaction(async (transaction) => {
        // 주문 생성
        const order = await this.orderManager.createOrder(
          userId,
          orderItems,
          transaction,
        );

        // 결제
        await this.walletManager.completePayment(
          userId,
          order.totalAmount,
          transaction,
        );

        // 상품 재고 감소
        await this.productManager.deductStock(order.orderItems, transaction);

        // 결제 완료 처리
        const completeOrder = await this.orderManager.updateOrderStatus(
          order.id,
          OrderStatus.PAID,
          transaction,
        );

        return completeOrder;
      });
    } catch (error) {
      throw new OrderFailedException();
    }
  }

  async getCartBy(userId: number) {
    return await this.cartManager.getCartBy(userId);
  }

  async addCartItem(userId: number, productId: bigint, quantity: number) {
    const cart = await this.cartManager.getCartBy(userId);

    return await this.cartManager.addCartItem(cart, productId, quantity);
  }

  async removeCartItem(userId: number, productId: number) {
    return await this.cartManager.removeCartItem(userId, productId);
  }
}
