import {
  BadRequestException,
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { AppException } from './common/errors/app.exception';
import { ErrorCodes } from './common/errors/error-codes';
import { correlationIdMiddleware } from './observability/correlation-id.middleware';

function formatValidationErrors(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => {
    if (error.constraints) {
      return Object.values(error.constraints);
    }
    if (error.children?.length) {
      return formatValidationErrors(error.children);
    }
    return [];
  });
}

function validationExceptionFactory(errors: ValidationError[]) {
  const messages = formatValidationErrors(errors);
  const nameError = errors.find((e) => e.property === 'name');
  if (nameError) {
    throw new AppException(
      ErrorCodes.TOURNAMENT_NAME_REQUIRED,
      'Informe o nome do torneio.',
    );
  }
  throw new BadRequestException(messages.length ? messages : ['Dados inválidos.']);
}

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api', {
    exclude: [{ path: 't/:publicToken', method: RequestMethod.GET }],
  });
  app.enableCors();
  app.use(correlationIdMiddleware);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
}
