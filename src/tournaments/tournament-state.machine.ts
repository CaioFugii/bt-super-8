import { HttpStatus } from '@nestjs/common';
import { TournamentStatus } from '../common/enums';
import { AppException } from '../common/errors/app.exception';
import { ErrorCodes } from '../common/errors/error-codes';

const ALLOWED_TRANSITIONS: Record<TournamentStatus, TournamentStatus[]> = {
  [TournamentStatus.DRAFT]: [
    TournamentStatus.IN_PROGRESS,
    TournamentStatus.CANCELLED,
  ],
  [TournamentStatus.IN_PROGRESS]: [
    TournamentStatus.FINISHED,
    TournamentStatus.CANCELLED,
  ],
  [TournamentStatus.FINISHED]: [],
  [TournamentStatus.CANCELLED]: [],
};

export const DRAFT_ONLY_TOURNAMENT_FIELDS = [
  'format',
  'date',
  'location',
  'courtCount',
  'name',
  'description',
  'logoUrl',
] as const;

export const IN_PROGRESS_BLOCKED_FIELDS = [
  'format',
  'date',
  'location',
  'courtCount',
] as const;

export function assertStatusTransition(
  from: TournamentStatus,
  to: TournamentStatus,
): void {
  if (from === to) return;

  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new AppException(
      ErrorCodes.BUSINESS_RULE_ERROR,
      'Esta alteração de status não é permitida.',
      HttpStatus.CONFLICT,
    );
  }
}

export function assertTournamentWritable(status: TournamentStatus): void {
  if (status === TournamentStatus.FINISHED) {
    throw new AppException(
      ErrorCodes.TOURNAMENT_ALREADY_FINISHED,
      'Não é possível alterar um torneio finalizado.',
    );
  }
  if (status === TournamentStatus.CANCELLED) {
    throw new AppException(
      ErrorCodes.BUSINESS_RULE_ERROR,
      'Não é possível alterar um torneio cancelado.',
      HttpStatus.CONFLICT,
    );
  }
}

export function assertDraftStatus(
  status: TournamentStatus,
  action: string,
): void {
  if (status !== TournamentStatus.DRAFT) {
    throw new AppException(
      ErrorCodes.TOURNAMENT_ALREADY_STARTED,
      `Não é possível ${action} após o início do torneio.`,
    );
  }
}

export function assertInProgressStatus(
  status: TournamentStatus,
  action: string,
): void {
  if (status !== TournamentStatus.IN_PROGRESS) {
    throw new AppException(
      ErrorCodes.BUSINESS_RULE_ERROR,
      `Não é possível ${action} neste status do torneio.`,
    );
  }
}

export function assertMatchGenerationAllowed(status: TournamentStatus): void {
  if (
    status === TournamentStatus.CANCELLED ||
    status === TournamentStatus.FINISHED
  ) {
    throw new AppException(
      ErrorCodes.MATCH_GENERATION_NOT_ALLOWED,
      'Não é possível gerar partidas neste status do torneio.',
    );
  }
  assertDraftStatus(status, 'gerar partidas');
}
