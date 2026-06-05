import { BadRequestException } from '@nestjs/common';
import { WinnerTeam } from '../common/enums';

const VALID_WITHOUT_TIEBREAK: Record<4 | 6, Set<string>> = {
  6: new Set(['6-0', '6-1', '6-2', '6-3', '6-4', '6-5']),
  4: new Set(['4-0', '4-1', '4-2', '4-3']),
};

const VALID_WITH_TIEBREAK: Record<4 | 6, Set<string>> = {
  6: new Set(['6-0', '6-1', '6-2', '6-3', '6-4', '7-5', '7-6']),
  4: new Set(['4-0', '4-1', '4-2', '5-3', '5-4']),
};

export function normalizeScoreKey(winner: number, loser: number): string {
  return `${winner}-${loser}`;
}

export function validateMatchScore(
  teamAScore: number,
  teamBScore: number,
  scoreLimit: 4 | 6,
  hasTieBreak: boolean,
): WinnerTeam {
  if (teamAScore === teamBScore) {
    throw new BadRequestException('O placar não pode terminar em empate');
  }

  const winnerScore = Math.max(teamAScore, teamBScore);
  const loserScore = Math.min(teamAScore, teamBScore);
  const key = normalizeScoreKey(winnerScore, loserScore);
  const validSet = hasTieBreak
    ? VALID_WITH_TIEBREAK[scoreLimit]
    : VALID_WITHOUT_TIEBREAK[scoreLimit];

  if (!validSet.has(key)) {
    throw new BadRequestException(
      `Placar inválido para a configuração do torneio (${scoreLimit} games, tie-break ${hasTieBreak ? 'ativo' : 'inativo'})`,
    );
  }

  return teamAScore > teamBScore ? WinnerTeam.TEAM_A : WinnerTeam.TEAM_B;
}

export function validateWinnerMatchesScore(
  winnerTeam: WinnerTeam,
  teamAScore: number,
  teamBScore: number,
): void {
  const expected =
    winnerTeam === WinnerTeam.TEAM_A
      ? teamAScore > teamBScore
      : teamBScore > teamAScore;
  if (!expected) {
    throw new BadRequestException(
      'O vencedor informado não corresponde ao placar',
    );
  }
}
