import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppErrorBody, isAppErrorBody } from './app.exception';
import { ErrorCodes } from './error-codes';
import { mapMessageToError } from './message-code-map';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, body } = this.normalize(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error('Unhandled error', exception);
    }

    response.status(status).json(body);
  }

  private normalize(exception: unknown): { status: number; body: AppErrorBody } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (isAppErrorBody(response)) {
        return { status, body: response };
      }

      if (typeof response === 'object' && response !== null) {
        const payload = response as Record<string, unknown>;

        if (isAppErrorBody(payload.message)) {
          return { status, body: payload.message };
        }

        if (typeof payload.code === 'string' && typeof payload.message === 'string') {
          return {
            status,
            body: {
              code: payload.code,
              message: payload.message,
              details: payload.details,
            },
          };
        }

        const message = this.extractMessage(payload);
        if (Array.isArray(message)) {
          return {
            status,
            body: {
              code: ErrorCodes.VALIDATION_ERROR,
              message: message[0] ?? 'Dados inválidos.',
              details: message,
            },
          };
        }

        if (status === HttpStatus.UNAUTHORIZED) {
          const mapped = mapMessageToError(message);
          return { status, body: mapped };
        }

        if (status === HttpStatus.NOT_FOUND) {
          const mapped = mapMessageToError(message);
          return { status, body: mapped };
        }

        if (status === HttpStatus.CONFLICT) {
          return {
            status,
            body: {
              code: ErrorCodes.BUSINESS_RULE_ERROR,
              message,
            },
          };
        }

        const mapped = mapMessageToError(message);
        return { status, body: mapped };
      }

      if (typeof response === 'string') {
        const mapped = mapMessageToError(response);
        return { status, body: mapped };
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: ErrorCodes.UNEXPECTED_ERROR,
        message:
          'Ocorreu um erro inesperado. Tente novamente em alguns instantes.',
      },
    };
  }

  private extractMessage(payload: Record<string, unknown>): string | string[] {
    const message = payload.message;
    if (typeof message === 'string' || Array.isArray(message)) {
      return message;
    }
    if (typeof payload.error === 'string') {
      return payload.error;
    }
    return 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.';
  }
}
