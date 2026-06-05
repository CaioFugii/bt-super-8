import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Organizer } from '../entities';

export const CurrentOrganizer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Organizer => {
    const request = ctx.switchToHttp().getRequest<{ user: Organizer }>();
    return request.user;
  },
);
