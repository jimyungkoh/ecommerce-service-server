import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { ErrorCodes } from 'src/common/errors';
import { CreateOrderCommand, UpdateOrderStatusCommand } from 'src/domain/dtos';
import { OrderInfo, OrderItemInfo } from 'src/domain/dtos/info';
import { CreateOrderInfo } from 'src/domain/dtos/info/order/create-order.result';
import { AppNotFoundException } from 'src/domain/exceptions';
import { OrderService } from 'src/domain/services';
import { UserRepository } from 'src/infrastructure/database/repositories';
import { OrderItemRepository } from 'src/infrastructure/database/repositories/order-item.repository';
import { OrderRepository } from 'src/infrastructure/database/repositories/order.repository';
import { OrderDomain, OrderStatus } from 'src/infrastructure/dtos/domains';
import { orderServiceFixture } from './helpers/order.service.fixture';

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

    orderService = module.get(OrderService);
  });

  describe('createOrder', () => {
    it('사용자가 존재하지 않으면 UserNotFoundException을 던져야 합니다', async () => {
      const { userId, transaction } = orderServiceFixture();
      userRepository.getById.mockRejectedValue(new Error());

      await expect(
        orderService.createOrder(
          new CreateOrderCommand({ userId, orderItems: [], transaction }),
        ),
      ).rejects.toThrow(new AppNotFoundException(ErrorCodes.USER_NOT_FOUND));
    });

    it('주문과 주문 항목을 생성해야 합니다', async () => {
      const { userId, user, order, orderItem, transaction } =
        orderServiceFixture();
      const orderItems = [orderItem];

      userRepository.getById.mockResolvedValue(user);
      orderRepository.create.mockResolvedValue(order);
      orderItemRepository.create.mockResolvedValue(orderItem);

      const result = await orderService.createOrder(
        new CreateOrderCommand({ userId, orderItems, transaction }),
      );

      const expected = new CreateOrderInfo({
        order: OrderInfo.from(order),
        orderItems: [OrderItemInfo.from(orderItem)],
      });

      expect(result).toEqual(expected);
    });
  });

  describe('updateOrderStatus', () => {
    it('주문 상태를 업데이트해야 합니다', async () => {
      const { orderId, orderParams, transaction } = orderServiceFixture();

      const updatedOrder = new OrderDomain({
        ...orderParams,
        status: OrderStatus.PAID,
      });

      orderRepository.update.mockResolvedValue(updatedOrder);

      const result = await orderService.updateOrderStatus(
        new UpdateOrderStatusCommand({
          orderId,
          status: updatedOrder.status,
          transaction,
        }),
      );

      expect(result).toEqual(OrderInfo.from(updatedOrder));
    });
  });
});
