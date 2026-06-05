import { MatchStatus } from '../common/enums';

/** Tabela base SPEC-002: letras A–H */
const BASE_MATCHES: Array<{
  round: number;
  matchNumber: number;
  teamA: [string, string];
  teamB: [string, string];
}> = [
  { round: 1, matchNumber: 1, teamA: ['A', 'H'], teamB: ['B', 'G'] },
  { round: 1, matchNumber: 2, teamA: ['C', 'F'], teamB: ['D', 'E'] },
  { round: 2, matchNumber: 3, teamA: ['A', 'G'], teamB: ['F', 'H'] },
  { round: 2, matchNumber: 4, teamA: ['B', 'E'], teamB: ['C', 'D'] },
  { round: 3, matchNumber: 5, teamA: ['A', 'F'], teamB: ['B', 'C'] },
  { round: 3, matchNumber: 6, teamA: ['E', 'G'], teamB: ['D', 'H'] },
  { round: 4, matchNumber: 7, teamA: ['A', 'E'], teamB: ['C', 'G'] },
  { round: 4, matchNumber: 8, teamA: ['D', 'F'], teamB: ['B', 'H'] },
  { round: 5, matchNumber: 9, teamA: ['A', 'D'], teamB: ['C', 'E'] },
  { round: 5, matchNumber: 10, teamA: ['B', 'F'], teamB: ['G', 'H'] },
  { round: 6, matchNumber: 11, teamA: ['A', 'C'], teamB: ['E', 'H'] },
  { round: 6, matchNumber: 12, teamA: ['B', 'D'], teamB: ['F', 'G'] },
  { round: 7, matchNumber: 13, teamA: ['A', 'B'], teamB: ['E', 'F'] },
  { round: 7, matchNumber: 14, teamA: ['C', 'H'], teamB: ['D', 'G'] },
];

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

export type GeneratedMatch = {
  tournamentId: string;
  round: number;
  matchNumber: number;
  courtNumber: number;
  teamAPlayer1Id: string;
  teamAPlayer2Id: string;
  teamBPlayer1Id: string;
  teamBPlayer2Id: string;
  status: MatchStatus.PENDING;
};

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function assignCourtNumber(
  matchNumber: number,
  round: number,
  courtCount: number,
): number {
  const indexInRound = matchNumber % 2 === 1 ? 0 : 1;
  const courtsToUse = Math.min(courtCount, 2);
  if (courtsToUse === 1) return 1;
  return indexInRound + 1;
}

export function generateSuper8Matches(
  tournamentId: string,
  participantIds: string[],
  courtCount: number,
): GeneratedMatch[] {
  if (participantIds.length !== 8) {
    throw new Error('O Super 8 exige exatamente 8 participantes');
  }

  const shuffled = shuffle(participantIds);
  const letterToId: Record<string, string> = {};
  LETTERS.forEach((letter, i) => {
    letterToId[letter] = shuffled[i];
  });

  return BASE_MATCHES.map((m) => ({
    tournamentId,
    round: m.round,
    matchNumber: m.matchNumber,
    courtNumber: assignCourtNumber(m.matchNumber, m.round, courtCount),
    teamAPlayer1Id: letterToId[m.teamA[0]],
    teamAPlayer2Id: letterToId[m.teamA[1]],
    teamBPlayer1Id: letterToId[m.teamB[0]],
    teamBPlayer2Id: letterToId[m.teamB[1]],
    status: MatchStatus.PENDING,
  }));
}
