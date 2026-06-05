import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gender, MatchStatus, WinnerTeam } from '../common/enums';
import { Match, Participant, Tournament } from '../entities';

export type RankingEntry = {
  position: number;
  participantId: string;
  participantName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  gamesFor: number;
  gamesAgainst: number;
  gamesBalance: number;
};

export type GenderHighlights = {
  best: RankingEntry;
  runnerUp: RankingEntry;
  last: RankingEntry;
};

type Stats = Omit<RankingEntry, 'position' | 'participantName'>;

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    @InjectRepository(Participant)
    private readonly participantRepo: Repository<Participant>,
  ) {}

  async calculate(
    tournament: Tournament,
  ): Promise<{ tournamentId: string; status: Tournament['status']; ranking: RankingEntry[] }> {
    const participants = await this.participantRepo.find({
      where: { tournamentId: tournament.id },
    });

    const matches = await this.matchRepo.find({
      where: { tournamentId: tournament.id },
    });

    const statsMap = new Map<string, Stats>();
    for (const p of participants) {
      statsMap.set(p.id, {
        participantId: p.id,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        gamesFor: 0,
        gamesAgainst: 0,
        gamesBalance: 0,
      });
    }

    const counted = matches.filter(
      (m) =>
        m.status === MatchStatus.FINISHED ||
        m.status === MatchStatus.WALKOVER,
    );

    for (const match of counted) {
      if (
        match.teamAScore == null ||
        match.teamBScore == null ||
        !match.winnerTeam
      ) {
        continue;
      }

      const teamAIds = [match.teamAPlayer1Id, match.teamAPlayer2Id];
      const teamBIds = [match.teamBPlayer1Id, match.teamBPlayer2Id];
      const teamAWon = match.winnerTeam === WinnerTeam.TEAM_A;

      for (const id of teamAIds) {
        this.applyMatchResult(
          statsMap,
          id,
          teamAWon,
          match.teamAScore,
          match.teamBScore,
        );
      }
      for (const id of teamBIds) {
        this.applyMatchResult(
          statsMap,
          id,
          !teamAWon,
          match.teamBScore,
          match.teamAScore,
        );
      }
    }

    const nameById = new Map(participants.map((p) => [p.id, p.name]));

    const sorted = [...statsMap.values()]
      .map((s) => ({
        ...s,
        participantName: nameById.get(s.participantId) ?? '',
        gamesBalance: s.gamesFor - s.gamesAgainst,
      }))
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.gamesBalance !== a.gamesBalance) return b.gamesBalance - a.gamesBalance;
        if (b.gamesFor !== a.gamesFor) return b.gamesFor - a.gamesFor;
        if (a.gamesAgainst !== b.gamesAgainst) return a.gamesAgainst - b.gamesAgainst;
        return a.participantName.localeCompare(b.participantName, 'pt-BR');
      });

    const ranking: RankingEntry[] = sorted.map((s, i) => ({
      position: i + 1,
      participantId: s.participantId,
      participantName: s.participantName,
      matchesPlayed: s.matchesPlayed,
      wins: s.wins,
      losses: s.losses,
      gamesFor: s.gamesFor,
      gamesAgainst: s.gamesAgainst,
      gamesBalance: s.gamesBalance,
    }));

    return {
      tournamentId: tournament.id,
      status: tournament.status,
      ranking,
    };
  }

  calculateGenderHighlights(
    ranking: RankingEntry[],
    genderByParticipantId: Map<string, Gender>,
    gender: Gender,
  ): GenderHighlights {
    const filtered = ranking
      .filter((r) => genderByParticipantId.get(r.participantId) === gender)
      .sort((a, b) => a.position - b.position);

    if (filtered.length < 3) {
      throw new Error(
        `É necessário ao menos 3 participantes do gênero ${gender} para calcular destaques`,
      );
    }

    return {
      best: filtered[0],
      runnerUp: filtered[1],
      last: filtered[filtered.length - 1],
    };
  }

  private applyMatchResult(
    statsMap: Map<string, Stats>,
    participantId: string,
    won: boolean,
    gamesFor: number,
    gamesAgainst: number,
  ): void {
    const stats = statsMap.get(participantId);
    if (!stats) return;

    stats.matchesPlayed += 1;
    if (won) stats.wins += 1;
    else stats.losses += 1;
    stats.gamesFor += gamesFor;
    stats.gamesAgainst += gamesAgainst;
    stats.gamesBalance = stats.gamesFor - stats.gamesAgainst;
  }
}
