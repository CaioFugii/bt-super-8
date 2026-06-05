import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TournamentStatus } from '../common/enums';
import { Tournament } from './tournament.entity';
import { Organizer } from './organizer.entity';

@Entity('tournament_status_audits')
export class TournamentStatusAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tournament_id' })
  tournamentId: string;

  @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Column({ name: 'from_status', type: 'enum', enum: TournamentStatus })
  fromStatus: TournamentStatus;

  @Column({ name: 'to_status', type: 'enum', enum: TournamentStatus })
  toStatus: TournamentStatus;

  @Column({ name: 'changed_by_user_id' })
  changedByUserId: string;

  @ManyToOne(() => Organizer)
  @JoinColumn({ name: 'changed_by_user_id' })
  changedBy: Organizer;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}
