import { TournamentStatus } from '../common/enums';
import { AppException } from '../common/errors/app.exception';
import {
  assertMatchGenerationAllowed,
  assertStatusTransition,
  assertTournamentWritable,
} from './tournament-state.machine';

describe('tournament-state.machine', () => {
  it('allows DRAFT to IN_PROGRESS', () => {
    expect(() =>
      assertStatusTransition(TournamentStatus.DRAFT, TournamentStatus.IN_PROGRESS),
    ).not.toThrow();
  });

  it('blocks FINISHED to DRAFT', () => {
    expect(() =>
      assertStatusTransition(TournamentStatus.FINISHED, TournamentStatus.DRAFT),
    ).toThrow(AppException);
  });

  it('blocks CANCELLED to IN_PROGRESS', () => {
    expect(() =>
      assertStatusTransition(
        TournamentStatus.CANCELLED,
        TournamentStatus.IN_PROGRESS,
      ),
    ).toThrow(AppException);
  });

  it('blocks match generation for finished tournaments', () => {
    expect(() =>
      assertMatchGenerationAllowed(TournamentStatus.FINISHED),
    ).toThrow(AppException);
  });

  it('blocks writes on finished tournaments', () => {
    expect(() => assertTournamentWritable(TournamentStatus.FINISHED)).toThrow(
      AppException,
    );
  });
});
