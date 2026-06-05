import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActiveUserGuard } from './active-user.guard';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly activeUserGuard: ActiveUserGuard) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const activated = await super.canActivate(context);
    if (!activated) {
      return false;
    }

    return this.activeUserGuard.canActivate(context);
  }
}
