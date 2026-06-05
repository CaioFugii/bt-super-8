import { MatchStatus } from '../common/enums';
import type { GeneratedMatch } from './super8.generator';

/** Tabela oficial SPEC-008A: símbolos H1–H4 (homens) e M1–M4 (mulheres) */
const BASE_MATCHES: Array<{
  round: number;
  matchNumber: number;
  teamA: [string, string];
  teamB: [string, string];
}> = [
  { round: 1, matchNumber: 1, teamA: ['H1', 'M2'], teamB: ['H3', 'M4'] },
  { round: 1, matchNumber: 2, teamA: ['H2', 'M3'], teamB: ['H4', 'M1'] },
  { round: 2, matchNumber: 3, teamA: ['H1', 'M4'], teamB: ['H4', 'M1'] },
  { round: 2, matchNumber: 4, teamA: ['H2', 'M3'], teamB: ['H3', 'M2'] },
  { round: 3, matchNumber: 5, teamA: ['H1', 'M2'], teamB: ['H4', 'M3'] },
  { round: 3, matchNumber: 6, teamA: ['H2', 'M1'], teamB: ['H3', 'M4'] },
  { round: 4, matchNumber: 7, teamA: ['H1', 'M4'], teamB: ['H3', 'M2'] },
  { round: 4, matchNumber: 8, teamA: ['H2', 'M1'], teamB: ['H4', 'M3'] },
  { round: 5, matchNumber: 9, teamA: ['H1', 'M3'], teamB: ['H2', 'M4'] },
  { round: 5, matchNumber: 10, teamA: ['H3', 'M1'], teamB: ['H4', 'M2'] },
  { round: 6, matchNumber: 11, teamA: ['H1', 'M1'], teamB: ['H3', 'M3'] },
  { round: 6, matchNumber: 12, teamA: ['H2', 'M4'], teamB: ['H4', 'M2'] },
  { round: 7, matchNumber: 13, teamA: ['H1', 'M1'], teamB: ['H2', 'M2'] },
  { round: 7, matchNumber: 14, teamA: ['H3', 'M3'], teamB: ['H4', 'M4'] },
];

const MALE_SYMBOLS = ['H1', 'H2', 'H3', 'H4'] as const;
const FEMALE_SYMBOLS = ['M1', 'M2', 'M3', 'M4'] as const;

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function assignCourtNumber(matchNumber: number, courtCount: number): number {
  const indexInRound = matchNumber % 2 === 1 ? 0 : 1;
  const courtsToUse = Math.min(courtCount, 2);
  if (courtsToUse === 1) return 1;
  return indexInRound + 1;
}

export function generateSuper8MixedMatches(
  tournamentId: string,
  maleIds: string[],
  femaleIds: string[],
  courtCount: number,
): GeneratedMatch[] {
  if (maleIds.length !== 4 || femaleIds.length !== 4) {
    throw new Error(
      'O Super 8 Misto exige exatamente 4 homens e 4 mulheres',
    );
  }

  const shuffledMales = shuffle(maleIds);
  const shuffledFemales = shuffle(femaleIds);

  const symbolToId: Record<string, string> = {};
  MALE_SYMBOLS.forEach((symbol, i) => {
    symbolToId[symbol] = shuffledMales[i];
  });
  FEMALE_SYMBOLS.forEach((symbol, i) => {
    symbolToId[symbol] = shuffledFemales[i];
  });

  return BASE_MATCHES.map((m) => ({
    tournamentId,
    round: m.round,
    matchNumber: m.matchNumber,
    courtNumber: assignCourtNumber(m.matchNumber, courtCount),
    teamAPlayer1Id: symbolToId[m.teamA[0]],
    teamAPlayer2Id: symbolToId[m.teamA[1]],
    teamBPlayer1Id: symbolToId[m.teamB[0]],
    teamBPlayer2Id: symbolToId[m.teamB[1]],
    status: MatchStatus.PENDING,
  }));
}
