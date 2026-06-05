import {
  BadRequestException,
  GoneException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common/interfaces';
import { AppLoggerService } from '../../observability/app-logger.service';
import { AppException } from './app.exception';
import { ErrorCodes } from './error-codes';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const appLogger = { logEvent: jest.fn() } as unknown as AppLoggerService;
  const filter = new HttpExceptionFilter(appLogger);

  function runFilter(exception: unknown) {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method: 'GET', path: '/api/test' }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);
    return { status, json };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns flat AppException body', () => {
    const { status, json } = runFilter(
      new AppException(
        ErrorCodes.INVALID_SCORE,
        'Informe um placar válido.',
      ),
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: ErrorCodes.INVALID_SCORE,
      message: 'Informe um placar válido.',
    });
  });

  it('maps known business messages to codes', () => {
    const { json } = runFilter(
      new BadRequestException('Este torneio já possui partidas geradas'),
    );

    expect(json).toHaveBeenCalledWith({
      code: ErrorCodes.MATCHES_ALREADY_GENERATED,
      message: 'As partidas deste torneio já foram geradas.',
    });
  });

  it('maps unauthorized to UNAUTHENTICATED', () => {
    const { status, json } = runFilter(
      new UnauthorizedException('Credenciais inválidas'),
    );

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      code: ErrorCodes.UNAUTHENTICATED,
      message: 'Faça login para continuar.',
    });
  });

  it('maps public link errors from nested payload', () => {
    const { json } = runFilter(
      new GoneException({
        code: 'PUBLIC_LINK_EXPIRED',
        message: 'Link expirado. Solicite um novo link ao organizador.',
      }),
    );

    expect(json).toHaveBeenCalledWith({
      code: 'PUBLIC_LINK_EXPIRED',
      message: 'Link expirado. Solicite um novo link ao organizador.',
    });
  });

  it('maps not found messages', () => {
    const { status, json } = runFilter(
      new NotFoundException('Torneio não encontrado'),
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: ErrorCodes.TOURNAMENT_NOT_FOUND,
      message: 'Torneio não encontrado',
    });
  });

  it('hides stack trace for unexpected errors', () => {
    const { status, json } = runFilter(new Error('boom'));

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: ErrorCodes.UNEXPECTED_ERROR,
      message:
        'Ocorreu um erro inesperado. Tente novamente em alguns instantes.',
    });
    expect(json.mock.calls[0][0]).not.toHaveProperty('stack');
    expect(appLogger.logEvent).toHaveBeenCalledWith(
      'error',
      'UNEXPECTED_ERROR',
      expect.objectContaining({
        code: ErrorCodes.UNEXPECTED_ERROR,
        route: 'GET /api/test',
      }),
    );
  });
});
