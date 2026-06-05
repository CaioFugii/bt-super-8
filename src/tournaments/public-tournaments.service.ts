import {
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Gender,
  MatchStatus,
  TournamentFormat,
  TournamentStatus,
} from '../common/enums';
import {
  Match,
  Participant,
  RevokedPublicToken,
  Tournament,
  TournamentChallenge,
} from '../entities';
import { RankingService } from './ranking.service';
import {
  buildPublicUrl,
  generatePublicToken,
  getPublicTokenExpiresAt,
  isPublicTokenExpired,
} from './public-token.util';

export type PublicTournamentView = {
  tournament: {
    name: string;
    date: string;
    location?: string;
    status: TournamentStatus;
    format: TournamentFormat;
  };
  participants: Array<{
    name: string;
    gender?: Gender;
    status: Participant['status'];
  }>;
  matches: Array<{
    round: number;
    matchNumber: number;
    courtNumber: number;
    teamA: { player1Name: string; player2Name: string };
    teamB: { player1Name: string; player2Name: string };
    teamAScore?: number;
    teamBScore?: number;
    winnerTeam?: Match['winnerTeam'];
    status: MatchStatus;
  }>;
  ranking: Array<{
    position: number;
    participantName: string;
    wins: number;
    losses: number;
    gamesFor: number;
    gamesAgainst: number;
    gamesBalance: number;
  }>;
  highlights?: {
    maleHighlights?: { best: string; runnerUp: string; last: string };
    femaleHighlights?: { best: string; runnerUp: string; last: string };
  };
  challenge?: { participantName: string; challengeText: string };
};

@Injectable()
export class PublicTournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepo: Repository<Tournament>,
    @InjectRepository(Participant)
    private readonly participantRepo: Repository<Participant>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    @InjectRepository(TournamentChallenge)
    private readonly challengeRepo: Repository<TournamentChallenge>,
    @InjectRepository(RevokedPublicToken)
    private readonly revokedRepo: Repository<RevokedPublicToken>,
    private readonly rankingService: RankingService,
    private readonly config: ConfigService,
  ) {}

  async validatePublicToken(publicToken: string): Promise<Tournament> {
    const revoked = await this.revokedRepo.findOne({ where: { token: publicToken } });
    if (revoked) {
      throw new GoneException({
        code: 'REVOKED',
        message: 'Link indisponível. Solicite um novo link ao organizador.',
      });
    }

    const tournament = await this.tournamentRepo.findOne({
      where: { publicToken },
    });

    if (!tournament) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Torneio não encontrado.',
      });
    }

    if (isPublicTokenExpired(tournament.publicTokenExpiresAt)) {
      throw new GoneException({
        code: 'EXPIRED',
        message: 'Link expirado. Solicite um novo link ao organizador.',
      });
    }

    return tournament;
  }

  async getByPublicToken(publicToken: string): Promise<PublicTournamentView> {
    const tournament = await this.validatePublicToken(publicToken);

    const [participants, matches, challenge] = await Promise.all([
      this.participantRepo.find({
        where: { tournamentId: tournament.id },
        order: { createdAt: 'ASC' },
      }),
      this.matchRepo.find({
        where: { tournamentId: tournament.id },
        relations: [
          'teamAPlayer1',
          'teamAPlayer2',
          'teamBPlayer1',
          'teamBPlayer2',
        ],
        order: { round: 'ASC', matchNumber: 'ASC' },
      }),
      this.challengeRepo.findOne({
        where: { tournamentId: tournament.id },
        relations: ['participant'],
      }),
    ]);

    const { ranking } = await this.rankingService.calculate(tournament);

    const response: PublicTournamentView = {
      tournament: {
        name: tournament.name,
        date: tournament.date,
        location: tournament.location,
        status: tournament.status,
        format: tournament.format,
      },
      participants: participants.map((p) => ({
        name: p.name,
        gender: p.gender,
        status: p.status,
      })),
      matches: matches.map((m) => ({
        round: m.round,
        matchNumber: m.matchNumber,
        courtNumber: m.courtNumber ?? 1,
        teamA: {
          player1Name: m.teamAPlayer1.name,
          player2Name: m.teamAPlayer2.name,
        },
        teamB: {
          player1Name: m.teamBPlayer1.name,
          player2Name: m.teamBPlayer2.name,
        },
        teamAScore: m.teamAScore,
        teamBScore: m.teamBScore,
        winnerTeam: m.winnerTeam,
        status: m.status,
      })),
      ranking: ranking.map((r) => ({
        position: r.position,
        participantName: r.participantName,
        wins: r.wins,
        losses: r.losses,
        gamesFor: r.gamesFor,
        gamesAgainst: r.gamesAgainst,
        gamesBalance: r.gamesBalance,
      })),
    };

    if (tournament.format === TournamentFormat.SUPER_8_MIXED) {
      const genderById = new Map(
        participants
          .filter((p) => p.gender)
          .map((p) => [p.id, p.gender!] as const),
      );
      const male = this.rankingService.calculateGenderHighlights(
        ranking,
        genderById,
        Gender.MALE,
      );
      const female = this.rankingService.calculateGenderHighlights(
        ranking,
        genderById,
        Gender.FEMALE,
      );
      response.highlights = {
        maleHighlights: {
          best: male.best.participantName,
          runnerUp: male.runnerUp.participantName,
          last: male.last.participantName,
        },
        femaleHighlights: {
          best: female.best.participantName,
          runnerUp: female.runnerUp.participantName,
          last: female.last.participantName,
        },
      };
    }

    if (challenge) {
      response.challenge = {
        participantName: challenge.participant.name,
        challengeText: challenge.challengeText,
      };
    }

    return response;
  }

  getPublicAppBaseUrl(): string {
    return this.config.get('APP_BASE_URL', 'http://localhost:3000');
  }

  buildPublicUrl(publicToken: string): string {
    return buildPublicUrl(this.getPublicAppBaseUrl(), publicToken);
  }

  async revokeToken(token: string): Promise<void> {
    const existing = await this.revokedRepo.findOne({ where: { token } });
    if (!existing) {
      await this.revokedRepo.save(this.revokedRepo.create({ token }));
    }
  }

  async generateUniqueToken(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const token = generatePublicToken();
      const [tournament, revoked] = await Promise.all([
        this.tournamentRepo.findOne({ where: { publicToken: token } }),
        this.revokedRepo.findOne({ where: { token } }),
      ]);
      if (!tournament && !revoked) return token;
    }
    throw new Error('Não foi possível gerar token público único');
  }

  getTokenExpiresAt(): Date {
    return getPublicTokenExpiresAt();
  }

  async createShareLink(tournament: Tournament) {
    if (tournament.publicToken) {
      await this.revokeToken(tournament.publicToken);
    }

    const publicToken = await this.generateUniqueToken();
    const publicTokenExpiresAt = this.getTokenExpiresAt();

    tournament.publicToken = publicToken;
    tournament.publicTokenExpiresAt = publicTokenExpiresAt;
    await this.tournamentRepo.save(tournament);

    return {
      publicUrl: this.buildPublicUrl(publicToken),
      publicTokenExpiresAt,
    };
  }

  async revokeShareLink(tournament: Tournament) {
    if (tournament.publicToken) {
      await this.revokeToken(tournament.publicToken);
    }

    tournament.publicToken = null;
    tournament.publicTokenExpiresAt = null;
    await this.tournamentRepo.save(tournament);

    return { success: true as const };
  }
}
