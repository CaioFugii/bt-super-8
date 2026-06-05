import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizerStatus } from '../common/enums';
import { AppException } from '../common/errors/app.exception';
import { ErrorCodes } from '../common/errors/error-codes';
import { Organizer } from '../entities';
import { USER_INACTIVE_MESSAGE } from './user-inactive.constants';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(
    @InjectRepository(Organizer)
    private readonly organizerRepo: Repository<Organizer>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: Organizer }>();
    const tokenUser = request.user;

    if (!tokenUser?.id) {
      throw new UnauthorizedException();
    }

    const user = await this.organizerRepo.findOne({
      where: { id: tokenUser.id },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.status !== OrganizerStatus.ACTIVE) {
      throw new AppException(
        ErrorCodes.USER_INACTIVE,
        USER_INACTIVE_MESSAGE,
        403,
      );
    }

    request.user = user;
    return true;
  }
}
