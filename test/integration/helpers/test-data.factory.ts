import { faker } from '@faker-js/faker';
import { OrderStatus, Prisma, TransactionType } from '@prisma/client';
import { ErrorCodes } from 'src/common/errors';
import { AppNotFoundException } from 'src/domain/exceptions/app-not-found.exception';
import {
  CartItemModel,
  CartModel,
  OrderItemModel,
  OrderModel,
  PointModel,
  PopularProductModel,
  ProductModel,
  ProductStockModel,
  UserModel,
  WalletModel,
} from 'src/domain/models';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { logger } from '../test-containers/setup-tests';

export class TestDataFactory {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(overrides: Partial<Prisma.UserUncheckedCreateInput> = {}) {
    const defaultData = {
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    const user = await this.prisma.user.create({
      data: { ...defaultData, ...overrides },
    });

    return UserModel.from(user);
  }

  async createWallet(
    userId: number,
    overrides: Partial<Prisma.WalletUncheckedCreateInput> = {},
  ): Promise<WalletModel> {
    const defaultData = {
      userId,
      totalPoint: overrides.totalPoint ?? 0,
    };
    const wallet = await this.prisma.wallet.create({
      data: { ...defaultData, ...overrides },
    });

    return WalletModel.from(wallet);
  }

  async getWallet(userId: number): Promise<WalletModel> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) throw new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND);

    return WalletModel.from(wallet);
  }

  async updateWallet(
    walletId: number,
    overrides: Partial<Prisma.WalletUncheckedUpdateInput> = {},
  ): Promise<WalletModel> {
    const wallet = await this.prisma.wallet.update({
      where: { id: walletId },
      data: overrides,
    });

    return WalletModel.from(wallet);
  }

  async createPoint(
    walletId: number,
    overrides: Partial<Prisma.PointUncheckedCreateInput> = {},
  ): Promise<PointModel> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) throw new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND);

    const defaultData = {
      walletId,
      amount: faker.number.float({ min: 1, max: 1000, fractionDigits: 2 }),
      transactionType: faker.helpers.arrayElement(
        Object.values(TransactionType),
      ),
      expiredAt: faker.date.future(),
    };

    const point = await this.prisma.point.create({
      data: { ...defaultData, ...overrides },
    });

    await this.prisma.wallet.update({
      where: { id: walletId },
      data: { totalPoint: { increment: defaultData.amount } },
    });

    return PointModel.from(point);
  }

  async createProduct(
    overrides: Partial<Prisma.ProductUncheckedCreateInput> = {},
  ): Promise<ProductModel> {
    const defaultData = {
      name: faker.commerce.productName(),
      price: faker.number.float({ min: 1, max: 1000, fractionDigits: 2 }),
    };

    const product = await this.prisma.product.create({
      data: {
        ...defaultData,
        ...overrides,
      },
    });

    return ProductModel.from(product);
  }

  async createProductStock(
    productId: number,
    overrides: Partial<Prisma.ProductStockUncheckedCreateInput> = {},
  ): Promise<ProductStockModel> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) throw new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND);

    const defaultData = {
      productId,
      stock: faker.number.int({ min: 0, max: 1000 }),
    };

    const productStock = await this.prisma.productStock.create({
      data: { ...defaultData, ...overrides },
    });

    return ProductStockModel.from(productStock);
  }

  async getProductStock(productId: number): Promise<ProductStockModel> {
    const productStock = await this.prisma.productStock.findUnique({
      where: { productId },
    });

    if (!productStock)
      throw new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND);

    return ProductStockModel.from(productStock);
  }

  async createOrder(
    userId: number,
    overrides: Partial<Prisma.OrderUncheckedCreateInput> = {},
  ) {
    const defaultData = {
      userId,
      status: faker.helpers.arrayElement(Object.values(OrderStatus)),
    };
    const order = await this.prisma.order.create({
      data: { ...defaultData, ...overrides },
    });

    return OrderModel.from(order);
  }

  async createOrderItem(
    orderId: number,
    productId: number,
    overrides: Partial<Prisma.OrderItemUncheckedCreateInput> = {},
  ): Promise<OrderItemModel> {
    const [order, product] = await Promise.all([
      this.prisma.order.findUnique({
        where: { id: orderId },
      }),
      this.prisma.product.findUnique({
        where: { id: productId },
      }),
    ]);

    if (!order) throw new AppNotFoundException(ErrorCodes.ORDER_NOT_FOUND);
    if (!product) throw new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND);

    const defaultData = {
      orderId,
      productId,
      quantity: faker.number.int({ min: 1, max: 10 }),
      price: faker.number.float({ min: 1, max: 1000, fractionDigits: 2 }),
    };

    const orderItem = await this.prisma.orderItem.create({
      data: { ...defaultData, ...overrides },
    });

    return OrderItemModel.from(orderItem);
  }

  async getOrderItems(orderId: number): Promise<OrderItemModel[]> {
    const orderItems = await this.prisma.orderItem.findMany({
      where: { orderId },
    });

    return orderItems.map(OrderItemModel.from);
  }

  async createCart(
    userId: number,
    overrides: Partial<Prisma.CartUncheckedCreateInput> = {},
  ): Promise<CartModel> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new AppNotFoundException(ErrorCodes.USER_NOT_FOUND);

    const defaultData = { userId };

    const cart = await this.prisma.cart.create({
      data: { ...defaultData, ...overrides },
    });

    return new CartModel({
      ...cart,
    });
  }

  async createCartItem(
    cartId: number,
    productId: number,
    overrides: Partial<Prisma.CartItemUncheckedCreateInput> = {},
  ): Promise<CartItemModel> {
    const [cart, product] = await Promise.all([
      this.prisma.cart.findUnique({
        where: { id: cartId },
      }),
      this.prisma.product.findUnique({
        where: { id: productId },
      }),
    ]);

    if (!cart) throw new AppNotFoundException(ErrorCodes.CART_NOT_FOUND);
    if (!product) throw new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND);

    const defaultData = {
      cartId,
      productId,
      quantity: faker.number.int({ min: 1, max: 10 }),
    };
    const cartItem = await this.prisma.cartItem.create({
      data: { ...defaultData, ...overrides },
    });

    return CartItemModel.from(cartItem);
  }

  async createPopularProduct(
    overrides: Partial<Prisma.PopularProductUncheckedCreateInput> = {},
  ): Promise<PopularProductModel> {
    const defaultData = {
      productId: faker.number.int(),
      salesCount: faker.number.int({ min: 1, max: 1000 }),
      aggregationDate: faker.date.recent(),
    };
    const popularProduct = await this.prisma.popularProduct.create({
      data: { ...defaultData, ...overrides },
    });

    return PopularProductModel.from(popularProduct);
  }

  async cleanupDatabase() {
    try {
      await Promise.all([
        this.prisma.orderItem.deleteMany(),
        this.prisma.order.deleteMany(),
        this.prisma.cartItem.deleteMany(),
        this.prisma.cart.deleteMany(),
        this.prisma.wallet.deleteMany(),
        this.prisma.productStock.deleteMany(),
        this.prisma.product.deleteMany(),
        this.prisma.user.deleteMany(),
      ]);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`데이터베이스 정리 실패: ${error.message}`);
        throw error;
      }
    }
  }
}
