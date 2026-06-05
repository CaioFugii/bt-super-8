import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizerStatus, UserRole } from '../common/enums';
import type { Tournament } from './tournament.entity';

@Entity('organizers')
export class Organizer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'instagram_handle', nullable: true })
  instagramHandle?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ORGANIZER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: OrganizerStatus,
    default: OrganizerStatus.ACTIVE,
  })
  status: OrganizerStatus;

  @OneToMany('Tournament', 'organizer')
  tournaments: Tournament[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
