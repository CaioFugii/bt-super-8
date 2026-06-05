import { WinnerTeam } from '../common/enums';
import { validateMatchScore } from './score.validator';

describe('validateMatchScore', () => {
  it('aceita 6x4 sem tie-break', () => {
    expect(validateMatchScore(6, 4, 6, false)).toBe(WinnerTeam.TEAM_A);
  });

  it('rejeita empate', () => {
    expect(() => validateMatchScore(6, 6, 6, false)).toThrow();
  });

  it('aceita 7x6 com tie-break', () => {
    expect(validateMatchScore(7, 6, 6, true)).toBe(WinnerTeam.TEAM_A);
  });

  it('rejeita 7x5 sem tie-break', () => {
    expect(() => validateMatchScore(7, 5, 6, false)).toThrow();
  });
});
