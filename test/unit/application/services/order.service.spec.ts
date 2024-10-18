import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { UserNotFoundException } from 'src/application/exceptions/user-not-found.exception';
import { OrderService } from 'src/application/services/order.service';
import { OrderDomain, OrderItemDomain, UserDomain } from 'src/domain';
import { UserRepository } from 'src/infrastructure/database/repositories';
import { OrderItemRepository } from 'src/infrastructure/database/repositories/order-item.repository';
import { OrderRepository } from 'src/infrastructure/database/repositories/order.repository';

describe('OrderService', () => {
  let orderService: OrderService;
  let userRepository: MockProxy<UserRepository>;
  let orderRepository: MockProxy<OrderRepository>;
  let orderItemRepository: MockProxy<OrderItemRepository>;

  beforeEach(async () => {
    userRepository = mockDeep<UserRepository>();
    orderRepository = mockDeep<OrderRepository>();
    orderItemRepository = mockDeep<OrderItemRepository>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: UserRepository, useValue: userRepository },
        { provide: OrderRepository, useValue: orderRepository },
        { provide: OrderItemRepository, useValue: orderItemRepository },
      ],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
  });

  describe('createOrder', () => {
    it('should throw UserNotFoundException if user does not exist', async () => {
      userRepository.getById.mockRejectedValue(new Error());

      await expect(
        orderService.createOrder(1, [], {} as Prisma.TransactionClient),
      ).rejects.toThrow(UserNotFoundException);
    });

    it('should create an order and order items', async () => {
      const userId = 1;
      const userStub = new UserDomain(
        userId,
        'test@email.com',
        new Date(),
        new Date(),
      );
      const orderStub = new OrderDomain(
        BigInt(1),
        userId,
        OrderStatus.PENDING_PAYMENT,
        new Date(),
        new Date(),
      );
      const orderItemStub = new OrderItemDomain(
        BigInt(1),
        BigInt(1),
        BigInt(1),
        2,
        new Decimal(100),
        new Date(),
        new Date(),
      );

      const orderItemsStub = [orderItemStub];

      const transaction = {} as Prisma.TransactionClient;

      userRepository.getById.mockResolvedValue(userStub);
      orderRepository.create.mockResolvedValue(orderStub);
      orderItemRepository.create.mockResolvedValue(orderItemStub);

      const result = await orderService.createOrder(
        userId,
        orderItemsStub,
        transaction,
      );

      const expected = {
        ...orderStub,
        orderItems: [orderItemStub],
        totalAmount: orderItemsStub.reduce(
          (acc, item) => acc.plus(item.price.times(item.quantity)),
          new Decimal(0),
        ),
      };

      expect({
        ...result,
        id: result.id.toString(),
        orderItems: result.orderItems.map((item) => ({
          ...item,
          id: item.id.toString(),
          orderId: item.orderId.toString(),
          productId: item.productId.toString(),
        })),
      }).toEqual({
        ...expected,
        id: expected.id.toString(),
        orderItems: [
          {
            ...orderItemStub,
            id: orderItemStub.id.toString(),
            orderId: orderItemStub.orderId.toString(),
            productId: orderItemStub.productId.toString(),
          },
        ],
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update the order status', async () => {
      const orderId = BigInt(1);
      const transaction = {} as Prisma.TransactionClient;

      const updatedOrderStub = new OrderDomain(
        orderId,
        1,
        OrderStatus.COMPLETED,
        new Date(),
        new Date(),
      );

      orderRepository.update.mockResolvedValue(updatedOrderStub);

      const result = await orderService.updateOrderStatus(
        orderId,
        updatedOrderStub.status,
        transaction,
      );

      expect({ ...result, orderId: orderId.toString() }).toEqual({
        ...updatedOrderStub,
        orderId: orderId.toString(),
      });
    });
  });
});
