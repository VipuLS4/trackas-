import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export type CurrentUserPayload = Pick<User, 'id' | 'role'>;

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;
    if (!user) {
      throw new Error('CurrentUser decorator requires user on request (JWT authentication required)');
    }
    return user;
  },
);
