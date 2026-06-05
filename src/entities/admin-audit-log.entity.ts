import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AdminAuditAction } from '../common/enums';

@Entity('admin_audit_logs')
export class AdminAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'admin_user_id', type: 'uuid' })
  adminUserId: string;

  @Column({ type: 'enum', enum: AdminAuditAction })
  action: AdminAuditAction;

  @Column({ name: 'target_user_id', type: 'uuid' })
  targetUserId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
