import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRequestDto } from 'src/presentation/dtos/request-dtos/user-request.dto';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    return new UserRequestDto({
      id: request.user.id,
      email: request.user.email,
    });
  },
);
