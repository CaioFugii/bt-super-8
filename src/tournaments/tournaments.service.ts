import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ForfeitChallengeMode,
  Gender,
  MatchStatus,
  ParticipantStatus,
  TournamentFormat,
  TournamentStatus,
  WinnerTeam,
} from '../common/enums';
import {
  Match,
  Organizer,
  Participant,
  Tournament,
  TournamentChallenge,
} from '../entities';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { UpdateMatchResultDto } from './dto/update-match-result.dto';
import { WalkoverMatchDto } from './dto/walkover-match.dto';
import { WithdrawParticipantDto } from './dto/withdraw-participant.dto';
import { generateSuper8Matches } from './super8.generator';
import { generateSuper8MixedMatches } from './super8-mixed.generator';
import { validateMatchScore } from './score.validator';
import { RankingService } from './ranking.service';
import { DEFAULT_FORFEIT_CHALLENGES } from './forfeit-challenge.constants';
import { PublicTournamentsService } from './public-tournaments.service';
import { isPublicTokenExpired } from './public-token.util';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepo: Repository<Tournament>,
    @InjectRepository(Participant)
    private readonly participantRepo: Repository<Participant>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    @InjectRepository(TournamentChallenge)
    private readonly challengeRepo: Repository<TournamentChallenge>,
    private readonly rankingService: RankingService,
    private readonly publicTournamentsService: PublicTournamentsService,
  ) {}

  async create(organizer: Organizer, dto: CreateTournamentDto) {
    this.validateForfeitConfig(dto);

    const tournament = this.tournamentRepo.create({
      organizerId: organizer.id,
      name: dto.name,
      description: dto.description,
      date: dto.date,
      location: dto.location,
      logoUrl: dto.logoUrl,
      scoreLimit: dto.scoreLimit,
      hasTieBreak: dto.hasTieBreak,
      walkoverScoreWinner: dto.walkoverScoreWinner,
      walkoverScoreLoser: dto.walkoverScoreLoser,
      format: dto.format ?? TournamentFormat.SUPER_8,
      courtCount: dto.courtCount ?? 1,
      enableForfeitChallenge: dto.enableForfeitChallenge ?? false,
      forfeitChallengeMode: dto.forfeitChallengeMode,
      customChallenges: dto.customChallenges,
      status: TournamentStatus.DRAFT,
    });

    return this.tournamentRepo.save(tournament);
  }

  async findAll(organizer: Organizer, status?: TournamentStatus) {
    const where: { organizerId: string; status?: TournamentStatus } = {
      organizerId: organizer.id,
    };
    if (status) where.status = status;

    return this.tournamentRepo.find({
      where,
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(organizer: Organizer, id: string) {
    return this.getOwnedTournament(organizer, id);
  }

  async update(organizer: Organizer, id: string, dto: UpdateTournamentDto) {
    const tournament = await this.getOwnedTournament(organizer, id);

    if (tournament.status !== TournamentStatus.DRAFT) {
      if (dto.courtCount !== undefined && dto.courtCount !== tournament.courtCount) {
        throw new BadRequestException(
          'Não é possível alterar a quantidade de quadras após gerar as partidas',
        );
      }
      const draftOnlyFields: (keyof UpdateTournamentDto)[] = [
        'scoreLimit',
        'hasTieBreak',
        'walkoverScoreWinner',
        'walkoverScoreLoser',
        'enableForfeitChallenge',
        'forfeitChallengeMode',
        'customChallenges',
      ];
      for (const field of draftOnlyFields) {
        if (dto[field] !== undefined) {
          throw new BadRequestException(
            `Não é possível alterar "${String(field)}" com o torneio em andamento ou finalizado`,
          );
        }
      }
    }

    if (dto.enableForfeitChallenge !== undefined || dto.forfeitChallengeMode) {
      this.validateForfeitConfig({ ...tournament, ...dto } as CreateTournamentDto);
    }

    Object.assign(tournament, dto);
    return this.tournamentRepo.save(tournament);
  }

  async cancel(organizer: Organizer, id: string) {
    const tournament = await this.getOwnedTournament(organizer, id);
    if (tournament.status === TournamentStatus.FINISHED) {
      throw new BadRequestException('Torneio finalizado não pode ser cancelado');
    }
    tournament.status = TournamentStatus.CANCELLED;
    tournament.cancelledAt = new Date();
    return this.tournamentRepo.save(tournament);
  }

  async remove(organizer: Organizer, id: string) {
    const tournament = await this.getOwnedTournament(organizer, id);
    await this.tournamentRepo.remove(tournament);
    return { deleted: true };
  }

  async addParticipant(
    organizer: Organizer,
    tournamentId: string,
    dto: CreateParticipantDto,
  ) {
    const tournament = await this.getOwnedTournament(organizer, tournamentId);
    this.assertDraft(tournament, 'adicionar participantes');

    const participants = await this.participantRepo.find({
      where: { tournamentId },
    });
    if (participants.length >= 8) {
      throw new BadRequestException('O Super 8 permite no máximo 8 participantes');
    }

    if (tournament.format === TournamentFormat.SUPER_8_MIXED) {
      if (!dto.gender) {
        throw new BadRequestException(
          'Participantes do Super 8 Misto devem informar o gênero',
        );
      }
      const sameGenderCount = participants.filter(
        (p) => p.gender === dto.gender,
      ).length;
      if (sameGenderCount >= 4) {
        throw new BadRequestException(
          dto.gender === Gender.MALE
            ? 'O Super 8 Misto permite no máximo 4 homens'
            : 'O Super 8 Misto permite no máximo 4 mulheres',
        );
      }
    }

    const participant = this.participantRepo.create({
      tournamentId,
      ...dto,
      status: ParticipantStatus.ACTIVE,
    });
    return this.participantRepo.save(participant);
  }

  async listParticipants(organizer: Organizer, tournamentId: string) {
    await this.getOwnedTournament(organizer, tournamentId);
    return this.participantRepo.find({
      where: { tournamentId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateParticipant(
    organizer: Organizer,
    tournamentId: string,
    participantId: string,
    dto: UpdateParticipantDto,
  ) {
    const tournament = await this.getOwnedTournament(organizer, tournamentId);
    this.assertDraft(tournament, 'editar participantes');

    const participant = await this.getParticipant(tournamentId, participantId);
    Object.assign(participant, dto);
    return this.participantRepo.save(participant);
  }

  async removeParticipant(
    organizer: Organizer,
    tournamentId: string,
    participantId: string,
  ) {
    const tournament = await this.getOwnedTournament(organizer, tournamentId);
    this.assertDraft(tournament, 'remover participantes');

    const participant = await this.getParticipant(tournamentId, participantId);
    await this.participantRepo.remove(participant);
    return { deleted: true };
  }

  async generateMatches(organizer: Organizer, tournamentId: string) {
    const tournament = await this.getOwnedTournament(organizer, tournamentId);
    this.assertDraft(tournament, 'gerar partidas');

    const existingMatches = await this.matchRepo.count({ where: { tournamentId } });
    if (existingMatches > 0) {
      throw new BadRequestException('Este torneio já possui partidas geradas');
    }

    const participants = await this.participantRepo.find({
      where: { tournamentId },
    });

    let generated;
    if (tournament.format === TournamentFormat.SUPER_8_MIXED) {
      const males = participants.filter((p) => p.gender === Gender.MALE);
      const females = participants.filter((p) => p.gender === Gender.FEMALE);

      if (participants.length !== 8) {
        throw new BadRequestException(
          'O Super 8 Misto exige exatamente 8 participantes cadastrados',
        );
      }
      if (males.length !== 4 || females.length !== 4) {
        throw new BadRequestException(
          'O Super 8 Misto exige exatamente 4 homens e 4 mulheres',
        );
      }

      generated = generateSuper8MixedMatches(
        tournamentId,
        males.map((p) => p.id),
        females.map((p) => p.id),
        tournament.courtCount,
      );
    } else {
      if (participants.length !== 8) {
        throw new BadRequestException(
          'O Super 8 exige exatamente 8 participantes cadastrados',
        );
      }

      generated = generateSuper8Matches(
        tournamentId,
        participants.map((p) => p.id),
        tournament.courtCount,
      );
    }

    const entities = generated.map((g) => this.matchRepo.create(g));
    await this.matchRepo.save(entities);

    tournament.status = TournamentStatus.IN_PROGRESS;
    await this.tournamentRepo.save(tournament);

    return this.listMatches(organizer, tournamentId);
  }

  async listMatches(organizer: Organizer, tournamentId: string) {
    await this.getOwnedTournament(organizer, tournamentId);

    const matches = await this.matchRepo.find({
      where: { tournamentId },
      relations: [
        'teamAPlayer1',
        'teamAPlayer2',
        'teamBPlayer1',
        'teamBPlayer2',
      ],
      order: { round: 'ASC', matchNumber: 'ASC' },
    });

    return matches.map((m) => this.formatMatch(m));
  }

  async updateMatchResult(
    organizer: Organizer,
    tournamentId: string,
    matchId: string,
    dto: UpdateMatchResultDto,
  ) {
    const tournament = await this.getOwnedTournament(organizer, tournamentId);
    if (tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Só é possível registrar resultados em torneios em andamento',
      );
    }

    const match = await this.getMatch(tournamentId, matchId);
    if (match.status !== MatchStatus.PENDING) {
      throw new BadRequestException('Partida já finalizada ou cancelada');
    }

    const winnerTeam = validateMatchScore(
      dto.teamAScore,
      dto.teamBScore,
      tournament.scoreLimit,
      tournament.hasTieBreak,
    );

    match.teamAScore = dto.teamAScore;
    match.teamBScore = dto.teamBScore;
    match.winnerTeam = winnerTeam;
    match.status = MatchStatus.FINISHED;

    await this.matchRepo.save(match);
    return this.formatMatch(
      await this.matchRepo.findOneOrFail({
        where: { id: match.id },
        relations: [
          'teamAPlayer1',
          'teamAPlayer2',
          'teamBPlayer1',
          'teamBPlayer2',
        ],
      }),
    );
  }

  async editMatchResult(
    organizer: Organizer,
    tournamentId: string,
    matchId: string,
    dto: UpdateMatchResultDto,
  ) {
    const tournament = await this.getOwnedTournament(organizer, tournamentId);
    if (tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Só é possível editar resultados em torneios em andamento',
      );
    }

    const match = await this.getMatch(tournamentId, matchId);
    if (
      match.status !== MatchStatus.FINISHED &&
      match.status !== MatchStatus.WALKOVER
    ) {
      throw new BadRequestException('Partida não possui resultado para editar');
    }

    const winnerTeam = validateMatchScore(
      dto.teamAScore,
      dto.teamBScore,
      tournament.scoreLimit,
      tournament.hasTieBreak,
    );

    match.teamAScore = dto.teamAScore;
    match.teamBScore = dto.teamBScore;
    match.winnerTeam = winnerTeam;
    match.status = MatchStatus.FINISHED;

    await this.matchRepo.save(match);
    return this.formatMatch(
      await this.matchRepo.findOneOrFail({
        where: { id: match.id },
        relations: [
          'teamAPlayer1',
          'teamAPlayer2',
          'teamBPlayer1',
          'teamBPlayer2',
        ],
      }),
    );
  }

  async markWalkover(
    organizer: Organizer,
    tournamentId: string,
    matchId: string,
    dto: WalkoverMatchDto,
  ) {
    const tournament = await this.getOwnedTournament(organizer, tournamentId);
    if (tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Só é possível marcar W.O. em torneios em andamento',
      );
    }

    const match = await this.getMatch(tournamentId, matchId);
    if (match.status !== MatchStatus.PENDING) {
      throw new BadRequestException('Partida já finalizada ou cancelada');
    }

    const { walkoverScoreWinner, walkoverScoreLoser } = tournament;
    if (dto.winnerTeam === WinnerTeam.TEAM_A) {
      match.teamAScore = walkoverScoreWinner;
      match.teamBScore = walkoverScoreLoser;
    } else {
      match.teamAScore = walkoverScoreLoser;
      match.teamBScore = walkoverScoreWinner;
    }
    match.winnerTeam = dto.winnerTeam;
    match.status = MatchStatus.WALKOVER;

    await this.matchRepo.save(match);
    return this.formatMatch(
      await this.matchRepo.findOneOrFail({
        where: { id: match.id },
        relations: [
          'teamAPlayer1',
          'teamAPlayer2',
          'teamBPlayer1',
          'teamBPlayer2',
        ],
      }),
    );
  }

  async withdrawParticipant(
    organizer: Organizer,
    tournamentId: string,
    participantId: string,
    dto: WithdrawParticipantDto,
  ) {
    const tournament = await this.getOwnedTournament(organizer, tournamentId);
    if (tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Desistência só pode ser registrada em torneios em andamento',
      );
    }

    const participant = await this.getParticipant(tournamentId, participantId);
    if (participant.status === ParticipantStatus.WITHDRAWN) {
      throw new BadRequestException('Participante já está desistente');
    }

    participant.status = ParticipantStatus.WITHDRAWN;
    participant.withdrawnAt = new Date();
    participant.withdrawReason = dto.reason;
    await this.participantRepo.save(participant);

    const pendingMatches = await this.matchRepo.find({
      where: { tournamentId, status: MatchStatus.PENDING },
    });

    const withdrawnIds = new Set(
      (
        await this.participantRepo.find({
          where: { tournamentId, status: ParticipantStatus.WITHDRAWN },
        })
      ).map((p) => p.id),
    );

    const affectedMatches: Array<{
      id: string;
      status: MatchStatus;
      winnerTeam?: WinnerTeam;
      teamAScore?: number;
      teamBScore?: number;
    }> = [];

    const toSave: Match[] = [];

    for (const match of pendingMatches) {
      const teamAWithdrawn =
        withdrawnIds.has(match.teamAPlayer1Id) ||
        withdrawnIds.has(match.teamAPlayer2Id);
      const teamBWithdrawn =
        withdrawnIds.has(match.teamBPlayer1Id) ||
        withdrawnIds.has(match.teamBPlayer2Id);

      if (!teamAWithdrawn && !teamBWithdrawn) continue;

      if (teamAWithdrawn && teamBWithdrawn) {
        match.status = MatchStatus.CANCELLED;
        match.winnerTeam = undefined;
        match.teamAScore = undefined;
        match.teamBScore = undefined;
        affectedMatches.push({ id: match.id, status: MatchStatus.CANCELLED });
      } else if (teamAWithdrawn) {
        this.applyWalkoverToMatch(match, tournament, WinnerTeam.TEAM_B);
        affectedMatches.push({
          id: match.id,
          status: MatchStatus.WALKOVER,
          winnerTeam: WinnerTeam.TEAM_B,
          teamAScore: match.teamAScore,
          teamBScore: match.teamBScore,
        });
      } else {
        this.applyWalkoverToMatch(match, tournament, WinnerTeam.TEAM_A);
        affectedMatches.push({
          id: match.id,
          status: MatchStatus.WALKOVER,
          winnerTeam: WinnerTeam.TEAM_A,
          teamAScore: match.teamAScore,
          teamBScore: match.teamBScore,
        });
      }
      toSave.push(match);
    }

    if (toSave.length) await this.matchRepo.save(toSave);

    return {
      participant: {
        id: participant.id,
        status: participant.status,
        withdrawnAt: participant.withdrawnAt,
      },
      affectedMatches,
    };
  }

  async finish(organizer: Organizer, tournamentId: string) {
    const tournament = await this.getOwnedTournament(organizer, tournamentId);
    if (tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Só é possível finalizar torneios em andamento',
      );
    }

    const pending = await this.matchRepo.count({
      where: { tournamentId, status: MatchStatus.PENDING },
    });
    if (pending > 0) {
      throw new BadRequestException(
        'Todas as partidas devem estar finalizadas ou com W.O. antes de encerrar o torneio',
      );
    }

    tournament.status = TournamentStatus.FINISHED;
    tournament.finishedAt = new Date();
    await this.tournamentRepo.save(tournament);

    if (tournament.enableForfeitChallenge) {
      await this.drawForfeitChallenge(tournament);
    }

    return this.findOne(organizer, tournamentId);
  }

  async generateShareLink(organizer: Organizer, tournamentId: string) {
    const tournament = await this.getOwnedTournament(organizer, tournamentId);
    return this.publicTournamentsService.createShareLink(tournament);
  }

  async revokeShareLink(organizer: Organizer, tournamentId: string) {
    const tournament = await this.getOwnedTournament(organizer, tournamentId);
    return this.publicTournamentsService.revokeShareLink(tournament);
  }

  async getShareLinkStatus(organizer: Organizer, tournamentId: string) {
    const tournament = await this.getOwnedTournament(organizer, tournamentId);
    const active =
      Boolean(tournament.publicToken) &&
      !isPublicTokenExpired(tournament.publicTokenExpiresAt);

    return {
      active,
      publicUrl: active
        ? this.publicTournamentsService.buildPublicUrl(tournament.publicToken!)
        : null,
      publicTokenExpiresAt: active ? tournament.publicTokenExpiresAt : null,
    };
  }

  async getRanking(organizer: Organizer, tournamentId: string) {
    const tournament = await this.getOwnedTournament(organizer, tournamentId);
    return this.rankingService.calculate(tournament);
  }

  async getHighlights(organizer: Organizer, tournamentId: string) {
    const tournament = await this.getOwnedTournament(organizer, tournamentId);
    if (tournament.format !== TournamentFormat.SUPER_8_MIXED) {
      throw new BadRequestException(
        'Destaques por gênero disponíveis apenas para torneios Super 8 Misto',
      );
    }

    const participants = await this.participantRepo.find({
      where: { tournamentId },
    });
    const genderById = this.buildGenderMap(participants);

    const { ranking } = await this.rankingService.calculate(tournament);
    if (!ranking.length) {
      throw new BadRequestException('Ranking vazio');
    }

    return {
      tournamentId: tournament.id,
      format: TournamentFormat.SUPER_8_MIXED,
      maleHighlights: this.rankingService.calculateGenderHighlights(
        ranking,
        genderById,
        Gender.MALE,
      ),
      femaleHighlights: this.rankingService.calculateGenderHighlights(
        ranking,
        genderById,
        Gender.FEMALE,
      ),
    };
  }

  async getSocialCardData(organizer: Organizer, tournamentId: string) {
    const tournament = await this.getOwnedTournament(organizer, tournamentId, [
      'organizer',
    ]);
    if (tournament.status !== TournamentStatus.FINISHED) {
      throw new BadRequestException(
        'Card disponível apenas para torneios finalizados',
      );
    }

    const { ranking } = await this.rankingService.calculate(tournament);
    if (!ranking.length) {
      throw new BadRequestException('Ranking vazio');
    }

    const baseRanking = ranking.map((r) => ({
      position: r.position,
      participantId: r.participantId,
      participantName: r.participantName,
      wins: r.wins,
      gamesBalance: r.gamesBalance,
      gamesFor: r.gamesFor,
      gamesAgainst: r.gamesAgainst,
    }));

    const response: Record<string, unknown> = {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        date: tournament.date,
        location: tournament.location,
        logoUrl: tournament.logoUrl,
        status: tournament.status,
        format: tournament.format,
      },
      ranking: baseRanking,
      organizer: {
        name: tournament.organizer.name,
        instagramHandle: tournament.organizer.instagramHandle,
      },
    };

    if (tournament.format === TournamentFormat.SUPER_8_MIXED) {
      const participants = await this.participantRepo.find({
        where: { tournamentId },
      });
      const genderById = this.buildGenderMap(participants);

      response.highlights = {
        male: this.rankingService.calculateGenderHighlights(
          ranking,
          genderById,
          Gender.MALE,
        ),
        female: this.rankingService.calculateGenderHighlights(
          ranking,
          genderById,
          Gender.FEMALE,
        ),
      };
    }

    return response;
  }

  async getChallenge(organizer: Organizer, tournamentId: string) {
    await this.getOwnedTournament(organizer, tournamentId);
    const challenge = await this.challengeRepo.findOne({
      where: { tournamentId },
      relations: ['participant'],
    });
    if (!challenge) {
      throw new NotFoundException('Nenhum desafio sorteado para este torneio');
    }
    return {
      tournamentId,
      participant: {
        id: challenge.participant.id,
        name: challenge.participant.name,
      },
      challenge: challenge.challengeText,
    };
  }

  private async drawForfeitChallenge(tournament: Tournament) {
    const existing = await this.challengeRepo.findOne({
      where: { tournamentId: tournament.id },
    });
    if (existing) return existing;

    const { ranking } = await this.rankingService.calculate(tournament);
    const last = ranking[ranking.length - 1];
    if (!last) return null;

    const pool =
      tournament.forfeitChallengeMode === ForfeitChallengeMode.CUSTOM
        ? tournament.customChallenges ?? []
        : DEFAULT_FORFEIT_CHALLENGES;

    if (!pool.length) {
      throw new BadRequestException(
        'Lista de prendas personalizada vazia',
      );
    }

    const challengeText = pool[Math.floor(Math.random() * pool.length)];
    const challenge = this.challengeRepo.create({
      tournamentId: tournament.id,
      participantId: last.participantId,
      challengeText,
    });
    return this.challengeRepo.save(challenge);
  }

  private applyWalkoverToMatch(
    match: Match,
    tournament: Tournament,
    winner: WinnerTeam,
  ) {
    if (winner === WinnerTeam.TEAM_A) {
      match.teamAScore = tournament.walkoverScoreWinner;
      match.teamBScore = tournament.walkoverScoreLoser;
    } else {
      match.teamAScore = tournament.walkoverScoreLoser;
      match.teamBScore = tournament.walkoverScoreWinner;
    }
    match.winnerTeam = winner;
    match.status = MatchStatus.WALKOVER;
  }

  private formatMatch(match: Match) {
    return {
      id: match.id,
      tournamentId: match.tournamentId,
      round: match.round,
      matchNumber: match.matchNumber,
      courtNumber: match.courtNumber,
      teamA: {
        player1: match.teamAPlayer1,
        player2: match.teamAPlayer2,
      },
      teamB: {
        player1: match.teamBPlayer1,
        player2: match.teamBPlayer2,
      },
      teamAScore: match.teamAScore,
      teamBScore: match.teamBScore,
      winnerTeam: match.winnerTeam,
      status: match.status,
    };
  }

  private async getOwnedTournament(
    organizer: Organizer,
    id: string,
    relations: string[] = [],
  ): Promise<Tournament> {
    const tournament = await this.tournamentRepo.findOne({
      where: { id, organizerId: organizer.id },
      relations,
    });
    if (!tournament) {
      throw new NotFoundException('Torneio não encontrado');
    }
    return tournament;
  }

  private async getParticipant(tournamentId: string, participantId: string) {
    const participant = await this.participantRepo.findOne({
      where: { id: participantId, tournamentId },
    });
    if (!participant) {
      throw new NotFoundException('Participante não encontrado');
    }
    return participant;
  }

  private async getMatch(tournamentId: string, matchId: string) {
    const match = await this.matchRepo.findOne({
      where: { id: matchId, tournamentId },
    });
    if (!match) {
      throw new NotFoundException('Partida não encontrada');
    }
    return match;
  }

  private assertDraft(tournament: Tournament, action: string) {
    if (tournament.status !== TournamentStatus.DRAFT) {
      throw new BadRequestException(
        `Não é possível ${action} quando o torneio não está em rascunho`,
      );
    }
  }

  private buildGenderMap(participants: Participant[]): Map<string, Gender> {
    const map = new Map<string, Gender>();
    for (const p of participants) {
      if (p.gender) map.set(p.id, p.gender);
    }
    return map;
  }

  private validateForfeitConfig(dto: Partial<CreateTournamentDto>) {
    if (dto.enableForfeitChallenge && dto.forfeitChallengeMode === ForfeitChallengeMode.CUSTOM) {
      if (!dto.customChallenges?.length) {
        throw new BadRequestException(
          'Informe ao menos uma prenda personalizada no modo CUSTOM',
        );
      }
    }
  }
}
