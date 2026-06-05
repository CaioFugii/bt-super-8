import { randomBytes } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { correlationIdStorage } from './correlation-id.store';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

function generateCorrelationId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = randomBytes(3).toString('hex').toUpperCase();
  return `REQ-${date}-${suffix}`;
}

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.headers[CORRELATION_ID_HEADER];
  const correlationId =
    typeof incoming === 'string' && incoming.trim()
      ? incoming.trim()
      : generateCorrelationId();

  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  correlationIdStorage.run(correlationId, () => next());
}
