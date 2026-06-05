import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Tournament } from './tournament.entity';
import { Participant } from './participant.entity';

@Entity('tournament_challenges')
export class TournamentChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tournament_id', unique: true })
  tournamentId: string;

  @OneToOne('Tournament', 'challenge', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Column({ name: 'participant_id' })
  participantId: string;

  @ManyToOne(() => Participant)
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @Column({ name: 'challenge_text', type: 'text' })
  challengeText: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
