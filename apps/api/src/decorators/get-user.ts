import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PayloadDto } from '../auth/dto/payload.dto';

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PayloadDto => {
    const request = ctx.switchToHttp().getRequest<{ user: PayloadDto }>();

    return request.user;
  },
);
