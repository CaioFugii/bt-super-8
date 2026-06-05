import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ForfeitChallengeMode,
  TournamentFormat,
  TournamentStatus,
} from '../common/enums';
import { Organizer } from './organizer.entity';
import type { Participant } from './participant.entity';
import type { Match } from './match.entity';
import type { TournamentChallenge } from './tournament-challenge.entity';

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organizer_id' })
  organizerId: string;

  @ManyToOne(() => Organizer, (o) => o.tournaments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizer_id' })
  organizer: Organizer;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  @Column({
    type: 'enum',
    enum: TournamentFormat,
    default: TournamentFormat.SUPER_8,
  })
  format: TournamentFormat;

  @Column({
    type: 'enum',
    enum: TournamentStatus,
    default: TournamentStatus.DRAFT,
  })
  status: TournamentStatus;

  @Column({ name: 'score_limit', type: 'smallint', default: 6 })
  scoreLimit: 4 | 6;

  @Column({ name: 'has_tie_break', default: false })
  hasTieBreak: boolean;

  @Column({ name: 'walkover_score_winner', default: 6 })
  walkoverScoreWinner: number;

  @Column({ name: 'walkover_score_loser', default: 0 })
  walkoverScoreLoser: number;

  @Column({ name: 'court_count', type: 'smallint', default: 1 })
  courtCount: number;

  @Column({ name: 'enable_forfeit_challenge', default: false })
  enableForfeitChallenge: boolean;

  @Column({
    name: 'forfeit_challenge_mode',
    type: 'enum',
    enum: ForfeitChallengeMode,
    nullable: true,
  })
  forfeitChallengeMode?: ForfeitChallengeMode;

  @Column({ name: 'custom_challenges', type: 'jsonb', nullable: true })
  customChallenges?: string[];

  @OneToMany('Participant', 'tournament')
  participants: Participant[];

  @OneToMany('Match', 'tournament')
  matches: Match[];

  @OneToOne('TournamentChallenge', 'tournament')
  challenge?: TournamentChallenge;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt?: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'public_token', type: 'varchar', length: 32, nullable: true, unique: true })
  publicToken: string | null;

  @Column({ name: 'public_token_expires_at', type: 'timestamptz', nullable: true })
  publicTokenExpiresAt: Date | null;
}
