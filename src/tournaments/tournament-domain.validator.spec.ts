import { AppException } from '../common/errors/app.exception';
import { ErrorCodes } from '../common/errors/error-codes';
import {
  assertNoDuplicateParticipant,
  validateCourtCount,
  validateParticipantName,
  validateTournamentDate,
  validateTournamentName,
} from './tournament-domain.validator';

describe('tournament-domain.validator', () => {
  it('validates tournament name', () => {
    expect(validateTournamentName('  Super 8  ')).toBe('Super 8');
    expect(() => validateTournamentName('  ')).toThrow(AppException);
    expect(() => validateTournamentName('ab')).toThrow(AppException);
  });

  it('rejects past tournament dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const iso = yesterday.toISOString().slice(0, 10);

    try {
      validateTournamentDate(iso);
      fail('expected error');
    } catch (error) {
      expect(error).toBeInstanceOf(AppException);
      expect((error as AppException).getResponse()).toMatchObject({
        code: ErrorCodes.TOURNAMENT_DATE_IN_PAST,
      });
    }
  });

  it('validates court count', () => {
    expect(validateCourtCount(10)).toBe(10);
    expect(() => validateCourtCount(11)).toThrow(AppException);
    expect(() => validateCourtCount(0)).toThrow(AppException);
  });

  it('blocks duplicate participants ignoring case', () => {
    expect(() =>
      assertNoDuplicateParticipant(
        [{ id: '1', name: 'João' } as never],
        'JOÃO',
      ),
    ).toThrow(AppException);
  });

  it('normalizes participant name', () => {
    expect(validateParticipantName('  Maria  Silva ')).toBe('Maria Silva');
  });
});
