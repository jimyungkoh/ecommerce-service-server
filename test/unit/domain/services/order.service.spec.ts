import { Test, TestingModule } from '@nestjs/testing';
import { Effect } from 'effect';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { ErrorCodes } from 'src/common/errors';
import { CreateOrderCommand, UpdateOrderStatusCommand } from 'src/domain/dtos';
import { OrderInfo, OrderItemInfo } from 'src/domain/dtos/info';
import { CreateOrderInfo } from 'src/domain/dtos/info/order/create-order.info';
import { AppNotFoundException } from 'src/domain/exceptions';
import { OrderModel, OrderStatus } from 'src/domain/models';
import { OrderService } from 'src/domain/services';
import { UserRepository } from 'src/infrastructure/database/repositories';
import { OrderItemRepository } from 'src/infrastructure/database/repositories/order-item.repository';
import { OrderRepository } from 'src/infrastructure/database/repositories/order.repository';
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
      userRepository.getById.mockImplementation(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.USER_NOT_FOUND)),
      );

      await expect(
        Effect.runPromise(
          orderService.createOrder(
            new CreateOrderCommand({ userId, orderItems: [], transaction }),
          ),
        ),
      ).rejects.toThrow(new AppNotFoundException(ErrorCodes.USER_NOT_FOUND));
    });

    it('주문과 주문 항목을 생성해야 합니다', async () => {
      const { userId, user, order, orderItem, transaction } =
        orderServiceFixture();
      const orderItems = [orderItem];

      userRepository.getById.mockImplementation(() => Effect.succeed(user));
      orderRepository.create.mockImplementation(() => Effect.succeed(order));
      orderItemRepository.create.mockImplementation(() =>
        Effect.succeed(orderItem),
      );

      const result = await Effect.runPromise(
        orderService.createOrder(
          new CreateOrderCommand({ userId, orderItems, transaction }),
        ),
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
      // given
      const { orderId, orderParams, transaction } = orderServiceFixture();

      const existingOrder = new OrderModel(orderParams);
      const updatedOrder = new OrderModel({
        ...orderParams,
        status: OrderStatus.PAID, // 상태를 "PAID"로 설정
      });

      // 모든 필요한 메서드를 모킹
      orderRepository.getById.mockImplementation(() =>
        Effect.succeed(existingOrder),
      );
      orderRepository.update.mockImplementation(() =>
        Effect.succeed(updatedOrder),
      );

      const command = new UpdateOrderStatusCommand({
        orderId,
        status: updatedOrder.status,
        transaction,
      });

      // when
      const result = await Effect.runPromise(
        orderService.updateOrderStatus(command),
      );

      // then
      expect(result).toEqual(OrderInfo.from(updatedOrder));
      expect(orderRepository.getById).toHaveBeenCalledWith(
        orderId,
        transaction,
      );
      expect(orderRepository.update).toHaveBeenCalledWith(
        orderId,
        { status: updatedOrder.status },
        transaction,
      );
    });

    it('존재하지 않는 주문 ID인 경우 AppNotFoundException을 던져야 합니다', async () => {
      // given
      const { orderId, transaction } = orderServiceFixture();

      // getById가 실패하도록 설정
      orderRepository.getById.mockImplementation(() =>
        Effect.fail(new AppNotFoundException(ErrorCodes.ORDER_NOT_FOUND)),
      );

      const command = new UpdateOrderStatusCommand({
        orderId,
        status: OrderStatus.PAID,
        transaction,
      });

      // when & then
      await expect(
        Effect.runPromise(orderService.updateOrderStatus(command)),
      ).rejects.toThrow(new AppNotFoundException(ErrorCodes.ORDER_NOT_FOUND));
    });
  });
});
