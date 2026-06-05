import { MatchStatus } from '../common/enums';
import { generateSuper8MixedMatches } from './super8-mixed.generator';

function mixedPairKey(
  a: string,
  b: string,
  males: Set<string>,
  females: Set<string>,
): string {
  const male = males.has(a) ? a : b;
  const female = females.has(a) ? a : b;
  return `${male}|${female}`;
}

describe('generateSuper8MixedMatches', () => {
  const maleIds = ['h1', 'h2', 'h3', 'h4'];
  const femaleIds = ['m1', 'm2', 'm3', 'm4'];
  const allIds = [...maleIds, ...femaleIds];
  const males = new Set(maleIds);
  const females = new Set(femaleIds);
  const tournamentId = 't1';

  it('gera exatamente 14 partidas', () => {
    const matches = generateSuper8MixedMatches(
      tournamentId,
      maleIds,
      femaleIds,
      2,
    );
    expect(matches).toHaveLength(14);
  });

  it('gera 7 rodadas com 2 partidas cada', () => {
    const matches = generateSuper8MixedMatches(
      tournamentId,
      maleIds,
      femaleIds,
      2,
    );
    for (let round = 1; round <= 7; round++) {
      expect(matches.filter((m) => m.round === round)).toHaveLength(2);
    }
  });

  it('matchNumber vai de 1 a 14 e round de 1 a 7', () => {
    const matches = generateSuper8MixedMatches(
      tournamentId,
      maleIds,
      femaleIds,
      2,
    );
    expect(matches.map((m) => m.matchNumber).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 14 }, (_, i) => i + 1),
    );
    expect(new Set(matches.map((m) => m.round))).toEqual(
      new Set([1, 2, 3, 4, 5, 6, 7]),
    );
  });

  it('cada jogador aparece 1 vez por rodada', () => {
    const matches = generateSuper8MixedMatches(
      tournamentId,
      maleIds,
      femaleIds,
      2,
    );
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
    const matches = generateSuper8MixedMatches(
      tournamentId,
      maleIds,
      femaleIds,
      2,
    );
    const count = new Map<string, number>();
    for (const id of allIds) count.set(id, 0);
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
    for (const id of allIds) {
      expect(count.get(id)).toBe(7);
    }
  });

  it('toda dupla possui 1 homem e 1 mulher', () => {
    const matches = generateSuper8MixedMatches(
      tournamentId,
      maleIds,
      femaleIds,
      2,
    );
    for (const m of matches) {
      for (const pair of [
        [m.teamAPlayer1Id, m.teamAPlayer2Id],
        [m.teamBPlayer1Id, m.teamBPlayer2Id],
      ] as const) {
        const hasMale = pair.some((id) => males.has(id));
        const hasFemale = pair.some((id) => females.has(id));
        expect(hasMale && hasFemale).toBe(true);
      }
    }
  });

  it('não existem duplas homem/homem ou mulher/mulher', () => {
    const matches = generateSuper8MixedMatches(
      tournamentId,
      maleIds,
      femaleIds,
      2,
    );
    for (const m of matches) {
      for (const pair of [
        [m.teamAPlayer1Id, m.teamAPlayer2Id],
        [m.teamBPlayer1Id, m.teamBPlayer2Id],
      ] as const) {
        const bothMale = pair.every((id) => males.has(id));
        const bothFemale = pair.every((id) => females.has(id));
        expect(bothMale || bothFemale).toBe(false);
      }
    }
  });

  it('todas as 16 duplas mistas aparecem ao menos uma vez', () => {
    const matches = generateSuper8MixedMatches(
      tournamentId,
      maleIds,
      femaleIds,
      2,
    );
    const pairs = new Set<string>();
    for (const m of matches) {
      pairs.add(
        mixedPairKey(m.teamAPlayer1Id, m.teamAPlayer2Id, males, females),
      );
      pairs.add(
        mixedPairKey(m.teamBPlayer1Id, m.teamBPlayer2Id, males, females),
      );
    }
    expect(pairs.size).toBe(16);
  });

  it('nenhuma dupla aparece mais de 2 vezes', () => {
    const matches = generateSuper8MixedMatches(
      tournamentId,
      maleIds,
      femaleIds,
      2,
    );
    const pairCounts = new Map<string, number>();
    for (const m of matches) {
      for (const pair of [
        [m.teamAPlayer1Id, m.teamAPlayer2Id],
        [m.teamBPlayer1Id, m.teamBPlayer2Id],
      ] as const) {
        const key = mixedPairKey(pair[0], pair[1], males, females);
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
    for (const count of pairCounts.values()) {
      expect(count).toBeLessThanOrEqual(2);
    }
  });

  it('rejeita quantidade inválida de homens ou mulheres', () => {
    expect(() =>
      generateSuper8MixedMatches(
        tournamentId,
        maleIds.slice(0, 3),
        femaleIds,
        1,
      ),
    ).toThrow('O Super 8 Misto exige exatamente 4 homens e 4 mulheres');

    expect(() =>
      generateSuper8MixedMatches(
        tournamentId,
        maleIds,
        femaleIds.slice(0, 3),
        1,
      ),
    ).toThrow('O Super 8 Misto exige exatamente 4 homens e 4 mulheres');
  });

  it('distribui quadras: courtCount=1 todas na quadra 1', () => {
    const matches = generateSuper8MixedMatches(
      tournamentId,
      maleIds,
      femaleIds,
      1,
    );
    expect(matches.every((m) => m.courtNumber === 1)).toBe(true);
  });

  it('distribui quadras: courtCount=2 uma partida por quadra por rodada', () => {
    const matches = generateSuper8MixedMatches(
      tournamentId,
      maleIds,
      femaleIds,
      2,
    );
    for (let round = 1; round <= 7; round++) {
      const roundMatches = matches.filter((m) => m.round === round);
      const courts = roundMatches.map((m) => m.courtNumber).sort();
      expect(courts).toEqual([1, 2]);
    }
  });

  it('status inicial PENDING', () => {
    const matches = generateSuper8MixedMatches(
      tournamentId,
      maleIds,
      femaleIds,
      2,
    );
    expect(matches.every((m) => m.status === MatchStatus.PENDING)).toBe(true);
  });
});
