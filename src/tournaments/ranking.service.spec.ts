import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Gender, MatchStatus, TournamentStatus, WinnerTeam } from '../common/enums';
import { Match, Participant, Tournament } from '../entities';
import { RankingService } from './ranking.service';

describe('RankingService', () => {
  let service: RankingService;

  const tournament: Tournament = {
    id: 't1',
    organizerId: 'o1',
    name: 'Test',
    date: '2026-06-01',
    status: TournamentStatus.IN_PROGRESS,
    scoreLimit: 6,
    hasTieBreak: false,
    walkoverScoreWinner: 6,
    walkoverScoreLoser: 0,
    courtCount: 1,
    enableForfeitChallenge: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Tournament;

  const participants: Participant[] = [
    { id: 'a', tournamentId: 't1', name: 'Ana' } as Participant,
    { id: 'b', tournamentId: 't1', name: 'Bruno' } as Participant,
    { id: 'c', tournamentId: 't1', name: 'Carlos' } as Participant,
    { id: 'd', tournamentId: 't1', name: 'Diana' } as Participant,
  ];

  const matches: Match[] = [
    {
      id: 'm1',
      tournamentId: 't1',
      round: 1,
      matchNumber: 1,
      teamAPlayer1Id: 'a',
      teamAPlayer2Id: 'b',
      teamBPlayer1Id: 'c',
      teamBPlayer2Id: 'd',
      teamAScore: 6,
      teamBScore: 4,
      winnerTeam: WinnerTeam.TEAM_A,
      status: MatchStatus.FINISHED,
    } as Match,
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RankingService,
        {
          provide: getRepositoryToken(Match),
          useValue: { find: jest.fn().mockResolvedValue(matches) },
        },
        {
          provide: getRepositoryToken(Participant),
          useValue: { find: jest.fn().mockResolvedValue(participants) },
        },
      ],
    }).compile();

    service = module.get(RankingService);
  });

  it('ranking vazio zera estatísticas', async () => {
    const module = await Test.createTestingModule({
      providers: [
        RankingService,
        {
          provide: getRepositoryToken(Match),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getRepositoryToken(Participant),
          useValue: { find: jest.fn().mockResolvedValue(participants) },
        },
      ],
    }).compile();
    const svc = module.get(RankingService);
    const result = await svc.calculate(tournament);
    expect(result.ranking.every((r) => r.wins === 0)).toBe(true);
  });

  it('vitória normal credita vencedores', async () => {
    const result = await service.calculate(tournament);
    const ana = result.ranking.find((r) => r.participantId === 'a');
    const carlos = result.ranking.find((r) => r.participantId === 'c');
    expect(ana?.wins).toBe(1);
    expect(carlos?.losses).toBe(1);
    expect(ana?.gamesFor).toBe(6);
    expect(carlos?.gamesAgainst).toBe(6);
  });

  it('ordena por vitórias', async () => {
    const result = await service.calculate(tournament);
    expect(result.ranking[0].wins).toBeGreaterThanOrEqual(result.ranking[1].wins);
  });

  describe('calculateGenderHighlights', () => {
    const mixedParticipants: Participant[] = [
      { id: 'ana', tournamentId: 't1', name: 'Ana', gender: Gender.FEMALE } as Participant,
      { id: 'joao', tournamentId: 't1', name: 'João', gender: Gender.MALE } as Participant,
      { id: 'maria', tournamentId: 't1', name: 'Maria', gender: Gender.FEMALE } as Participant,
      { id: 'pedro', tournamentId: 't1', name: 'Pedro', gender: Gender.MALE } as Participant,
      { id: 'fernanda', tournamentId: 't1', name: 'Fernanda', gender: Gender.FEMALE } as Participant,
      { id: 'carlos', tournamentId: 't1', name: 'Carlos', gender: Gender.MALE } as Participant,
      { id: 'juliana', tournamentId: 't1', name: 'Juliana', gender: Gender.FEMALE } as Participant,
      { id: 'rafael', tournamentId: 't1', name: 'Rafael', gender: Gender.MALE } as Participant,
    ];

    const mixedRanking = [
      { position: 1, participantId: 'ana', participantName: 'Ana', matchesPlayed: 7, wins: 6, losses: 1, gamesFor: 40, gamesAgainst: 20, gamesBalance: 20 },
      { position: 2, participantId: 'joao', participantName: 'João', matchesPlayed: 7, wins: 5, losses: 2, gamesFor: 38, gamesAgainst: 25, gamesBalance: 13 },
      { position: 3, participantId: 'maria', participantName: 'Maria', matchesPlayed: 7, wins: 4, losses: 3, gamesFor: 35, gamesAgainst: 30, gamesBalance: 5 },
      { position: 4, participantId: 'pedro', participantName: 'Pedro', matchesPlayed: 7, wins: 4, losses: 3, gamesFor: 34, gamesAgainst: 31, gamesBalance: 3 },
      { position: 5, participantId: 'fernanda', participantName: 'Fernanda', matchesPlayed: 7, wins: 3, losses: 4, gamesFor: 30, gamesAgainst: 33, gamesBalance: -3 },
      { position: 6, participantId: 'carlos', participantName: 'Carlos', matchesPlayed: 7, wins: 2, losses: 5, gamesFor: 25, gamesAgainst: 38, gamesBalance: -13 },
      { position: 7, participantId: 'juliana', participantName: 'Juliana', matchesPlayed: 7, wins: 1, losses: 6, gamesFor: 20, gamesAgainst: 40, gamesBalance: -20 },
      { position: 8, participantId: 'rafael', participantName: 'Rafael', matchesPlayed: 7, wins: 0, losses: 7, gamesFor: 15, gamesAgainst: 42, gamesBalance: -27 },
    ];

    const genderById = new Map(
      mixedParticipants.map((p) => [p.id, p.gender!] as const),
    );

    it('calcula destaques masculinos corretamente', () => {
      const highlights = service.calculateGenderHighlights(
        mixedRanking,
        genderById,
        Gender.MALE,
      );
      expect(highlights.best.participantName).toBe('João');
      expect(highlights.runnerUp.participantName).toBe('Pedro');
      expect(highlights.last.participantName).toBe('Rafael');
    });

    it('calcula destaques femininos corretamente', () => {
      const highlights = service.calculateGenderHighlights(
        mixedRanking,
        genderById,
        Gender.FEMALE,
      );
      expect(highlights.best.participantName).toBe('Ana');
      expect(highlights.runnerUp.participantName).toBe('Maria');
      expect(highlights.last.participantName).toBe('Juliana');
    });
  });
});
