import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrderFacade } from 'src/application/facades';
import { Private } from 'src/common/decorators/private.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { CartItemInfo, OrderInfo } from 'src/domain/dtos/info';
import { GetCartByInfo } from 'src/domain/dtos/info/cart/get-cart-by-info';
import { AddCartDto } from '../dtos/add-cart.dto';
import { OrderCreateDto } from '../dtos/order-create.dto';
import { UserRequestDto } from '../dtos/request-dtos/user-request.dto';

@ApiTags('/orders')
@Controller('/orders')
export class OrderController {
  constructor(private readonly orderUseCase: OrderFacade) {}

  @Private()
  @Post()
  async createOrder(
    @User() user: UserRequestDto,
    @Body() orderCreateDto: OrderCreateDto,
  ): Promise<OrderInfo> {
    return this.orderUseCase.order(user.id, orderCreateDto.orderItems);
  }

  @Private()
  @Post('/cart')
  async addCartItem(
    @User() user: UserRequestDto,
    addCartDto: AddCartDto,
  ): Promise<CartItemInfo> {
    return this.orderUseCase.addCartItem(
      user.id,
      addCartDto.productId,
      addCartDto.quantity,
    );
  }

  @Private()
  @Patch('/cart/:itemId')
  async removeCartItem(
    @User() user: UserRequestDto,
    @Param('itemId', new ParseIntPipe()) itemId: number,
  ): Promise<void> {
    return this.orderUseCase.removeCartItem(user.id, itemId);
  }

  @Private()
  @Get('/cart')
  async getCartItems(@User() user: UserRequestDto): Promise<GetCartByInfo> {
    return this.orderUseCase.getCartBy(user.id);
  }
}
