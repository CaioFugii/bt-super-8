import { MatchStatus } from '../common/enums';
import { generateSuper8Matches } from './super8.generator';

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

describe('generateSuper8Matches', () => {
  const ids = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
  const tournamentId = 't1';

  it('gera exatamente 14 partidas', () => {
    const matches = generateSuper8Matches(tournamentId, ids, 2);
    expect(matches).toHaveLength(14);
  });

  it('gera 7 rodadas com 2 partidas cada', () => {
    const matches = generateSuper8Matches(tournamentId, ids, 2);
    for (let round = 1; round <= 7; round++) {
      expect(matches.filter((m) => m.round === round)).toHaveLength(2);
    }
  });

  it('cada jogador aparece 1 vez por rodada', () => {
    const matches = generateSuper8Matches(tournamentId, ids, 2);
    for (let round = 1; round <= 7; round++) {
      const roundMatches = matches.filter((m) => m.round === round);
      const appearances = new Set<string>();
      for (const m of roundMatches) {
        [
          m.teamAPlayer1Id,
          m.teamAPlayer2Id,
          m.teamBPlayer1Id,
          m.teamBPlayer2Id,
        ].forEach((id) => appearances.add(id));
      }
      expect(appearances.size).toBe(8);
    }
  });

  it('cada jogador joga 7 partidas', () => {
    const matches = generateSuper8Matches(tournamentId, ids, 2);
    const count = new Map<string, number>();
    for (const id of ids) count.set(id, 0);
    for (const m of matches) {
      for (const id of [
        m.teamAPlayer1Id,
        m.teamAPlayer2Id,
        m.teamBPlayer1Id,
        m.teamBPlayer2Id,
      ]) {
        count.set(id, (count.get(id) ?? 0) + 1);
      }
    }
    for (const id of ids) {
      expect(count.get(id)).toBe(7);
    }
  });

  it('28 duplas únicas — cada par faz dupla uma vez', () => {
    const matches = generateSuper8Matches(tournamentId, ids, 2);
    const pairs = new Set<string>();
    for (const m of matches) {
      pairs.add(pairKey(m.teamAPlayer1Id, m.teamAPlayer2Id));
      pairs.add(pairKey(m.teamBPlayer1Id, m.teamBPlayer2Id));
    }
    expect(pairs.size).toBe(28);
  });

  it('rejeita quantidade diferente de 8 participantes', () => {
    expect(() =>
      generateSuper8Matches(tournamentId, ids.slice(0, 7), 1),
    ).toThrow('O Super 8 exige exatamente 8 participantes');
  });

  it('distribui quadras: courtCount=1 todas na quadra 1', () => {
    const matches = generateSuper8Matches(tournamentId, ids, 1);
    expect(matches.every((m) => m.courtNumber === 1)).toBe(true);
  });

  it('distribui quadras: courtCount=2 uma partida por quadra por rodada', () => {
    const matches = generateSuper8Matches(tournamentId, ids, 2);
    for (let round = 1; round <= 7; round++) {
      const roundMatches = matches.filter((m) => m.round === round);
      const courts = roundMatches.map((m) => m.courtNumber).sort();
      expect(courts).toEqual([1, 2]);
    }
  });

  it('status inicial PENDING', () => {
    const matches = generateSuper8Matches(tournamentId, ids, 2);
    expect(matches.every((m) => m.status === MatchStatus.PENDING)).toBe(true);
  });
});
