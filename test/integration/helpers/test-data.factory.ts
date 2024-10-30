import { faker } from '@faker-js/faker';
import { OrderStatus, Prisma, Product, TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';
import { ErrorCodes } from 'src/common/errors';
import { AppNotFoundException } from 'src/domain/exceptions/app-not-found.exception';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import {
  CartDomain,
  CartItemDomain,
  OrderDomain,
  OrderItemDomain,
  PointDomain,
  PopularProductDomain,
  ProductDomain,
  ProductStockDomain,
  UserDomain,
  WalletDomain,
} from 'src/infrastructure/dtos/domains';
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

    return new UserDomain({
      ...user,
    });
  }

  async createWallet(
    userId: number,
    overrides: Partial<Prisma.WalletUncheckedCreateInput> = {},
  ): Promise<WalletDomain> {
    const defaultData = {
      userId,
      totalPoint: overrides.totalPoint ?? new Decimal(0),
    };
    const wallet = await this.prisma.wallet.create({
      data: { ...defaultData, ...overrides },
    });

    return new WalletDomain({
      id: wallet.id,
      userId: wallet.userId,
      totalPoint: wallet.totalPoint,
      version: wallet.version,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    });
  }

  async getWallet(userId: number): Promise<WalletDomain> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) throw new AppNotFoundException(ErrorCodes.WALLET_NOT_FOUND);

    return new WalletDomain({
      id: wallet.id,
      userId: wallet.userId,
      totalPoint: wallet.totalPoint,
      version: wallet.version,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    });
  }

  async updateWallet(
    walletId: number,
    overrides: Partial<Prisma.WalletUncheckedUpdateInput> = {},
  ): Promise<WalletDomain> {
    const wallet = await this.prisma.wallet.update({
      where: { id: walletId },
      data: overrides,
    });

    return new WalletDomain({
      id: wallet.id,
      userId: wallet.userId,
      totalPoint: wallet.totalPoint,
      version: wallet.version,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    });
  }

  async createPoint(
    walletId: number,
    overrides: Partial<Prisma.PointUncheckedCreateInput> = {},
  ): Promise<PointDomain> {
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

    return new PointDomain({
      ...point,
    });
  }

  async createProduct(
    overrides: Partial<Product> = {},
  ): Promise<ProductDomain> {
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

    return new ProductDomain({
      id: product.id,
      name: product.name,
      price: product.price,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }

  async createProductStock(
    productId: bigint,
    overrides: Partial<Prisma.ProductStockUncheckedCreateInput> = {},
  ): Promise<ProductStockDomain> {
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

    return new ProductStockDomain({
      ...productStock,
    });
  }

  async getProductStock(productId: bigint): Promise<ProductStockDomain> {
    const productStock = await this.prisma.productStock.findUnique({
      where: { productId },
    });

    if (!productStock)
      throw new AppNotFoundException(ErrorCodes.PRODUCT_NOT_FOUND);

    return new ProductStockDomain({
      ...productStock,
    });
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

    return new OrderDomain({
      ...order,
    });
  }

  async createOrderItem(
    orderId: bigint,
    productId: bigint,
    overrides: Partial<Prisma.OrderItemUncheckedCreateInput> = {},
  ): Promise<OrderItemDomain> {
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

    return new OrderItemDomain({
      ...orderItem,
    });
  }

  async getOrderItems(orderId: bigint): Promise<OrderItemDomain[]> {
    const orderItems = await this.prisma.orderItem.findMany({
      where: { orderId },
    });

    return orderItems.map((orderItem) => new OrderItemDomain({ ...orderItem }));
  }

  async createCart(
    userId: number,
    overrides: Partial<Prisma.CartUncheckedCreateInput> = {},
  ): Promise<CartDomain> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new AppNotFoundException(ErrorCodes.USER_NOT_FOUND);

    const defaultData = { userId };

    const cart = await this.prisma.cart.create({
      data: { ...defaultData, ...overrides },
    });

    return new CartDomain({
      ...cart,
    });
  }

  async createCartItem(
    cartId: number,
    productId: bigint,
    overrides: Partial<Prisma.CartItemUncheckedCreateInput> = {},
  ): Promise<CartItemDomain> {
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

    return new CartItemDomain({
      ...cartItem,
    });
  }

  async createPopularProduct(
    overrides: Partial<Prisma.PopularProductUncheckedCreateInput> = {},
  ): Promise<PopularProductDomain> {
    const defaultData = {
      productId: faker.number.bigInt(),
      salesCount: faker.number.bigInt({ min: 1, max: 1000 }),
      aggregationDate: faker.date.recent(),
    };
    const popularProduct = await this.prisma.popularProduct.create({
      data: { ...defaultData, ...overrides },
    });

    return new PopularProductDomain({
      ...popularProduct,
    });
  }

  async cleanupDatabase() {
    try {
      await this.prisma.$transaction([
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
