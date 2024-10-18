import { TypedException, TypedRoute } from '@nestia/core';
import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ProductNotFoundException,
  ProductOutOfStockException,
  UserNotFoundException,
} from 'src/application/exceptions';
import { OrderUseCase } from 'src/application/use-cases';
import { ErrorCode } from 'src/common/errors';
import { OrderFailedException } from '../../application/exceptions/order-failed.exception';
import { AddCartDto } from '../dto/add-cart-dto';
import { OrderCreateDto } from '../dto/order-create.dto';

/**
 * @Controller('orders')
 * 주문 관련 요청을 처리하는 컨트롤러입니다.
 */
@ApiTags('orders')
@Controller('orders')
export class OrderController {
  /**
   * OrderController 생성자
   * @param {OrderUseCase} orderUseCase - 주문 관련 비즈니스 로직을 처리하는 유스케이스
   */
  constructor(private readonly orderUseCase: OrderUseCase) {}

  /**
   * 새로운 주문을 생성합니다.
   * @param {OrderCreateDto} orderCreateDto - 주문 생성에 필요한 데이터 전송 객체
   * @returns {Promise<any>} 생성된 주문 정보
   */
  @TypedRoute.Post()
  @TypedException<ProductNotFoundException>({
    status: ErrorCode.PRODUCT_NOT_FOUND.status,
    description: ErrorCode.PRODUCT_NOT_FOUND.message,
  })
  @TypedException<ProductOutOfStockException>({
    status: ErrorCode.PRODUCT_OUT_OF_STOCK.status,
    description: ErrorCode.PRODUCT_OUT_OF_STOCK.message,
  })
  @TypedException<UserNotFoundException>({
    status: ErrorCode.USER_NOT_FOUND.status,
    description: ErrorCode.USER_NOT_FOUND.message,
  })
  @TypedException<OrderFailedException>({
    status: ErrorCode.ORDER_FAILED.status,
    description: ErrorCode.ORDER_FAILED.message,
  })
  @Post()
  async createOrder(orderCreateDto: OrderCreateDto) {
    return this.orderUseCase.order(
      orderCreateDto.userId,
      orderCreateDto.orderItems,
    );
  }

  /**
   * 장바구니에 아이템을 추가합니다.
   * @param {AddCartDto} addCartDto - 장바구니에 추가할 아이템 정보
   * @returns {Promise<any>} 추가된 장바구니 아이템 정보
   */
  @TypedRoute.Post('/cart')
  @TypedException<ProductNotFoundException>({
    status: ErrorCode.PRODUCT_NOT_FOUND.status,
    description: ErrorCode.PRODUCT_NOT_FOUND.message,
  })
  @Post('/cart')
  async addCartItem(addCartDto: AddCartDto) {
    return this.orderUseCase.addCartItem(
      addCartDto.userId,
      addCartDto.productId,
      addCartDto.quantity,
    );
  }

  /**
   * 장바구니에서 아이템을 제거합니다.
   * @param {number} userId - 사용자 ID
   * @param {number} itemId - 제거할 아이템 ID
   * @returns {Promise<any>} 제거된 장바구니 아이템 정보
   */
  @TypedRoute.Delete('/cart/:userId/:itemId')
  @Delete('/cart/:userId/:itemId')
  async removeCartItem(
    @Param('userId', new ParseIntPipe()) userId: number,
    @Param('itemId', new ParseIntPipe()) itemId: number,
  ) {
    return this.orderUseCase.removeCartItem(userId, itemId);
  }

  /**
   * 사용자의 장바구니 아이템 목록을 조회합니다.
   * @param {number} userId - 사용자 ID
   * @returns {Promise<any>} 장바구니 아이템 목록
   */
  @TypedRoute.Get('/cart/:userId')
  @TypedException<UserNotFoundException>({
    status: ErrorCode.USER_NOT_FOUND.status,
    description: ErrorCode.USER_NOT_FOUND.message,
  })
  @Get('/cart/:userId')
  async getCartItems(@Param('userId', new ParseIntPipe()) userId: number) {
    return this.orderUseCase.getCartBy(userId);
  }
}
