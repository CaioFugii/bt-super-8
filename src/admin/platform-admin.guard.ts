import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from '../common/enums';
import { AppException } from '../common/errors/app.exception';
import { ErrorCodes } from '../common/errors/error-codes';
import { Organizer } from '../entities';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: Organizer }>();
    const user = request.user;

    if (!user || user.role !== UserRole.PLATFORM_ADMIN) {
      throw new AppException(
        ErrorCodes.FORBIDDEN,
        'Acesso negado.',
        403,
      );
    }

    return true;
  }
}
