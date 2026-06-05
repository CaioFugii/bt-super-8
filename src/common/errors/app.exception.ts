import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode } from './error-codes';

export type AppErrorBody = {
  code: ErrorCode | string;
  message: string;
  details?: unknown;
};

export class AppException extends HttpException {
  constructor(
    code: ErrorCode | string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: unknown,
  ) {
    const body: AppErrorBody = { code, message };
    if (details !== undefined) {
      body.details = details;
    }
    super(body, status);
  }
}

export function isAppErrorBody(value: unknown): value is AppErrorBody {
  if (!value || typeof value !== 'object') return false;
  const body = value as AppErrorBody;
  return typeof body.code === 'string' && typeof body.message === 'string';
}
