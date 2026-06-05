import { Injectable, Logger } from '@nestjs/common';
import { getCorrelationId } from './correlation-id.store';
import { sanitizeLogData } from './sanitize-log.util';

export type LogLevel = 'info' | 'warn' | 'error';

export type TechnicalLogEvent =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'API_ERROR'
  | 'DATABASE_ERROR'
  | 'UNEXPECTED_ERROR'
  | 'PUBLIC_PAGE_ACCESS';

@Injectable()
export class AppLoggerService {
  private readonly logger = new Logger('TechnicalLog');

  logEvent(
    level: LogLevel,
    event: TechnicalLogEvent | string,
    fields: Record<string, unknown> = {},
  ): void {
    const sanitized = sanitizeLogData(fields) as Record<string, unknown>;
    const payload = {
      level,
      event,
      timestamp: new Date().toISOString(),
      correlationId: getCorrelationId(),
      ...sanitized,
    };

    const line = JSON.stringify(payload);
    if (level === 'error') {
      this.logger.error(line);
      return;
    }
    if (level === 'warn') {
      this.logger.warn(line);
      return;
    }
    this.logger.log(line);
  }
}
