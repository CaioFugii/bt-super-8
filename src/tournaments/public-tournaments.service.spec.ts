import { GoneException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Gender,
  MatchStatus,
  TournamentFormat,
  TournamentStatus,
  WinnerTeam,
} from '../common/enums';
import {
  Match,
  Participant,
  RevokedPublicToken,
  Tournament,
  TournamentChallenge,
} from '../entities';
import { RankingService } from './ranking.service';
import { PublicTournamentsService } from './public-tournaments.service';

describe('PublicTournamentsService', () => {
  let service: PublicTournamentsService;

  const tournament: Tournament = {
    id: 't1',
    organizerId: 'o1',
    name: 'Torneio Teste',
    date: '2026-06-10',
    location: 'Praia',
    format: TournamentFormat.SUPER_8,
    status: TournamentStatus.IN_PROGRESS,
    publicToken: 'active-token',
    publicTokenExpiresAt: new Date(Date.now() + 60_000),
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
    {
      id: 'p1',
      tournamentId: 't1',
      name: 'Ana',
      phone: '11999999999',
      notes: 'interno',
      gender: Gender.FEMALE,
      status: 'ACTIVE',
    } as Participant,
    {
      id: 'p2',
      tournamentId: 't1',
      name: 'João',
      status: 'ACTIVE',
    } as Participant,
  ];

  const matches: Match[] = [
    {
      id: 'm1',
      tournamentId: 't1',
      round: 1,
      matchNumber: 1,
      courtNumber: 1,
      teamAPlayer1Id: 'p1',
      teamAPlayer2Id: 'p2',
      teamBPlayer1Id: 'p2',
      teamBPlayer2Id: 'p1',
      teamAPlayer1: { id: 'p1', name: 'Ana' },
      teamAPlayer2: { id: 'p2', name: 'João' },
      teamBPlayer1: { id: 'p2', name: 'João' },
      teamBPlayer2: { id: 'p1', name: 'Ana' },
      teamAScore: 6,
      teamBScore: 4,
      winnerTeam: WinnerTeam.TEAM_A,
      status: MatchStatus.FINISHED,
    } as Match,
  ];

  const tournamentRepo = {
    findOne: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
  };
  const participantRepo = { find: jest.fn().mockResolvedValue(participants) };
  const matchRepo = { find: jest.fn().mockResolvedValue(matches) };
  const challengeRepo = { findOne: jest.fn().mockResolvedValue(null) };
  const revokedRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn(),
    create: jest.fn((data) => data),
  };
  const rankingService = {
    calculate: jest.fn().mockResolvedValue({
      ranking: [
        {
          position: 1,
          participantId: 'p1',
          participantName: 'Ana',
          matchesPlayed: 1,
          wins: 1,
          losses: 0,
          gamesFor: 6,
          gamesAgainst: 4,
          gamesBalance: 2,
        },
      ],
    }),
    calculateGenderHighlights: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    tournamentRepo.findOne.mockResolvedValue(tournament);

    const module = await Test.createTestingModule({
      providers: [
        PublicTournamentsService,
        { provide: getRepositoryToken(Tournament), useValue: tournamentRepo },
        { provide: getRepositoryToken(Participant), useValue: participantRepo },
        { provide: getRepositoryToken(Match), useValue: matchRepo },
        {
          provide: getRepositoryToken(TournamentChallenge),
          useValue: challengeRepo,
        },
        {
          provide: getRepositoryToken(RevokedPublicToken),
          useValue: revokedRepo,
        },
        { provide: RankingService, useValue: rankingService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('https://super8.app') },
        },
      ],
    }).compile();

    service = module.get(PublicTournamentsService);
  });

  it('retorna dados públicos sem telefone, e-mail ou observações', async () => {
    const data = await service.getByPublicToken('active-token');
    expect(data.tournament.name).toBe('Torneio Teste');
    expect(data.participants[0]).toEqual({
      name: 'Ana',
      gender: Gender.FEMALE,
      status: 'ACTIVE',
    });
    expect(data.participants[0]).not.toHaveProperty('phone');
    expect(data.participants[0]).not.toHaveProperty('id');
    expect(data.matches[0].teamA.player1Name).toBe('Ana');
    expect(data.ranking[0].participantName).toBe('Ana');
  });

  it('bloqueia token inexistente', async () => {
    tournamentRepo.findOne.mockResolvedValue(null);
    await expect(service.getByPublicToken('invalid')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('bloqueia token expirado', async () => {
    tournamentRepo.findOne.mockResolvedValue({
      ...tournament,
      publicTokenExpiresAt: new Date(Date.now() - 1000),
    });
    await expect(service.getByPublicToken('active-token')).rejects.toBeInstanceOf(
      GoneException,
    );
  });

  it('bloqueia token revogado', async () => {
    revokedRepo.findOne.mockResolvedValue({ token: 'revoked-token' });
    await expect(service.getByPublicToken('revoked-token')).rejects.toBeInstanceOf(
      GoneException,
    );
  });

  it('createShareLink gera token e validade de 24h', async () => {
    jest.spyOn(service, 'generateUniqueToken').mockResolvedValue('new-token-12');
    const before = Date.now();
    const result = await service.createShareLink({ ...tournament });
    expect(result.publicUrl).toBe('https://super8.app/t/new-token-12');
    expect(
      result.publicTokenExpiresAt.getTime() - before,
    ).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 1000);
    expect(tournamentRepo.save).toHaveBeenCalled();
  });

  it('novo compartilhamento invalida token anterior', async () => {
    jest.spyOn(service, 'generateUniqueToken').mockResolvedValue('new-token');
    const revokeSpy = jest.spyOn(service, 'revokeToken');
    await service.createShareLink({ ...tournament, publicToken: 'old-token' });
    expect(revokeSpy).toHaveBeenCalledWith('old-token');
  });

  it('revokeShareLink remove token ativo', async () => {
    const revokeSpy = jest.spyOn(service, 'revokeToken');
    const result = await service.revokeShareLink({
      ...tournament,
      publicToken: 'active-token',
    });
    expect(revokeSpy).toHaveBeenCalledWith('active-token');
    expect(result.success).toBe(true);
    expect(tournamentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ publicToken: null, publicTokenExpiresAt: null }),
    );
  });
});
