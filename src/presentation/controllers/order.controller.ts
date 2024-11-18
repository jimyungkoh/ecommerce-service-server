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
import { AddCartDto } from '../dtos/add-cart.dto';
import { OrderCreateDto } from '../dtos/order-create.dto';
import { UserRequestDto } from '../dtos/request-dtos/user-request.dto';

@ApiTags('/orders')
@Controller('/orders')
export class OrderController {
  constructor(private readonly orderUseCase: OrderFacade) {}

  @Private()
  @Post()
  createOrder(
    @User() user: UserRequestDto,
    @Body() orderCreateDto: OrderCreateDto,
  ) {
    return this.orderUseCase.order(user.id, orderCreateDto.orderItems);
  }

  @Private()
  @Post('/cart')
  addCartItem(@User() user: UserRequestDto, addCartDto: AddCartDto) {
    return this.orderUseCase.addCartItem(
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
    return this.orderUseCase.removeCartItem(user.id, itemId);
  }

  @Private()
  @Get('/cart')
  getCartItems(@User() user: UserRequestDto) {
    return this.orderUseCase.getCartBy(user.id);
  }
}
