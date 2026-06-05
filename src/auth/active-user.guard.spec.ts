import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizerStatus } from '../common/enums';
import { AppException } from '../common/errors/app.exception';
import { ErrorCodes } from '../common/errors/error-codes';
import { Organizer } from '../entities';
import { ActiveUserGuard } from './active-user.guard';
import { USER_INACTIVE_MESSAGE } from './user-inactive.constants';

describe('ActiveUserGuard', () => {
  let guard: ActiveUserGuard;
  let organizerRepo: jest.Mocked<Pick<Repository<Organizer>, 'findOne'>>;

  const userId = 'user-1';

  const createContext = (user?: Partial<Organizer>): ExecutionContext => {
    const request = { user };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    organizerRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActiveUserGuard,
        {
          provide: getRepositoryToken(Organizer),
          useValue: organizerRepo,
        },
      ],
    }).compile();

    guard = module.get(ActiveUserGuard);
  });

  it('bloqueia quando não há usuário autenticado', async () => {
    const context = createContext();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(organizerRepo.findOne).not.toHaveBeenCalled();
  });

  it('consulta o usuário atual no banco antes de autorizar', async () => {
    const context = createContext({
      id: userId,
      status: OrganizerStatus.ACTIVE,
    } as Organizer);

    organizerRepo.findOne.mockResolvedValue({
      id: userId,
      status: OrganizerStatus.ACTIVE,
    } as Organizer);

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(organizerRepo.findOne).toHaveBeenCalledWith({
      where: { id: userId },
    });
  });

  it('retorna USER_INACTIVE e HTTP 403 para usuário inativo', async () => {
    const context = createContext({
      id: userId,
      status: OrganizerStatus.ACTIVE,
    } as Organizer);

    organizerRepo.findOne.mockResolvedValue({
      id: userId,
      status: OrganizerStatus.INACTIVE,
    } as Organizer);

    try {
      await guard.canActivate(context);
      fail('Expected guard to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(AppException);
      expect(error).toMatchObject({
        response: {
          code: ErrorCodes.USER_INACTIVE,
          message: USER_INACTIVE_MESSAGE,
        },
        status: 403,
      });
    }
  });

  it('bloqueia quando o usuário não existe mais no banco', async () => {
    const context = createContext({
      id: userId,
      status: OrganizerStatus.ACTIVE,
    } as Organizer);

    organizerRepo.findOne.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
