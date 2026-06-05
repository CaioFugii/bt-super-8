import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction } from '../common/enums';
import { AuditLog } from '../entities';

export type AuditRecordInput = {
  action: AuditAction;
  userId?: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async record(input: AuditRecordInput): Promise<AuditLog> {
    const log = this.auditRepo.create({
      action: input.action,
      userId: input.userId,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
    });
    return this.auditRepo.save(log);
  }
}
