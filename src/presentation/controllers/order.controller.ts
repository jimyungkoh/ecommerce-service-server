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
import {
  AddCartRequestDto,
  CreateOrderRequestDto,
  UserRequestDto,
} from '../dtos';

@ApiTags('/orders')
@Controller('/orders')
export class OrderController {
  constructor(private readonly orderFacade: OrderFacade) {}

  @Private()
  @Get('/:orderId')
  getOrder(
    @User() user: UserRequestDto,
    @Param('orderId', new ParseIntPipe()) orderId: number,
  ) {
    return this.orderFacade.getOrder(user.id, orderId);
  }

  @Private()
  @Post()
  createOrder(
    @User() user: UserRequestDto,
    @Body() orderCreateDto: CreateOrderRequestDto,
  ) {
    return this.orderFacade.order(user.id, orderCreateDto.orderItems);
  }

  @Private()
  @Post('/cart')
  addCartItem(@User() user: UserRequestDto, addCartDto: AddCartRequestDto) {
    return this.orderFacade.addCartItem(
      user.id,
      addCartDto.productId,
      addCartDto.quantity,
    );
  }

  @Private()
  @Patch('/cart/:itemId')
  removeCartItem(
    @User() user: UserRequestDto,
    @Param('itemId', new ParseIntPipe()) itemId: number,
  ) {
    return this.orderFacade.removeCartItem(user.id, itemId);
  }

  @Private()
  @Get('/cart')
  getCartItems(@User() user: UserRequestDto) {
    return this.orderFacade.getCartBy(user.id);
  }
}
