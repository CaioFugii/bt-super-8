import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MatchStatus, WinnerTeam } from '../common/enums';
import type { Tournament } from './tournament.entity';
import { Participant } from './participant.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tournament_id' })
  tournamentId: string;

  @ManyToOne('Tournament', 'matches', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Column({ type: 'smallint' })
  round: number;

  @Column({ name: 'match_number', type: 'smallint' })
  matchNumber: number;

  @Column({ name: 'court_number', type: 'smallint', nullable: true })
  courtNumber?: number;

  @Column({ name: 'team_a_player1_id' })
  teamAPlayer1Id: string;

  @Column({ name: 'team_a_player2_id' })
  teamAPlayer2Id: string;

  @Column({ name: 'team_b_player1_id' })
  teamBPlayer1Id: string;

  @Column({ name: 'team_b_player2_id' })
  teamBPlayer2Id: string;

  @ManyToOne(() => Participant)
  @JoinColumn({ name: 'team_a_player1_id' })
  teamAPlayer1: Participant;

  @ManyToOne(() => Participant)
  @JoinColumn({ name: 'team_a_player2_id' })
  teamAPlayer2: Participant;

  @ManyToOne(() => Participant)
  @JoinColumn({ name: 'team_b_player1_id' })
  teamBPlayer1: Participant;

  @ManyToOne(() => Participant)
  @JoinColumn({ name: 'team_b_player2_id' })
  teamBPlayer2: Participant;

  @Column({ name: 'team_a_score', type: 'smallint', nullable: true })
  teamAScore?: number;

  @Column({ name: 'team_b_score', type: 'smallint', nullable: true })
  teamBScore?: number;

  @Column({
    name: 'winner_team',
    type: 'enum',
    enum: WinnerTeam,
    nullable: true,
  })
  winnerTeam?: WinnerTeam;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.PENDING,
  })
  status: MatchStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
