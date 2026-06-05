import { HttpStatus } from '@nestjs/common';
import { AppException } from '../common/errors/app.exception';
import { ErrorCodes } from '../common/errors/error-codes';
import type { Participant } from '../entities';

const MAX_FUTURE_YEARS = 2;

export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function validateTournamentName(name: string): string {
  const normalized = normalizeText(name);
  if (!normalized) {
    throw new AppException(
      ErrorCodes.TOURNAMENT_NAME_REQUIRED,
      'Informe o nome do torneio.',
    );
  }
  if (normalized.length < 3) {
    throw new AppException(
      ErrorCodes.TOURNAMENT_NAME_REQUIRED,
      'Informe o nome do torneio.',
    );
  }
  if (normalized.length > 100) {
    throw new AppException(
      ErrorCodes.VALIDATION_ERROR,
      'O nome do torneio deve ter no máximo 100 caracteres.',
    );
  }
  return normalized;
}

export function validateTournamentDate(date: string): string {
  if (!date?.trim()) {
    throw new AppException(
      ErrorCodes.TOURNAMENT_DATE_REQUIRED,
      'Informe a data do torneio.',
    );
  }

  const parsed = parseIsoDate(date);
  const today = startOfDay(new Date());
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + MAX_FUTURE_YEARS);

  if (parsed < today) {
    throw new AppException(
      ErrorCodes.TOURNAMENT_DATE_IN_PAST,
      'A data do torneio não pode estar no passado.',
    );
  }
  if (parsed > maxDate) {
    throw new AppException(
      ErrorCodes.TOURNAMENT_DATE_TOO_FAR,
      'A data informada é inválida.',
    );
  }

  return date;
}

export function validateCourtCount(courtCount: number): number {
  if (!Number.isInteger(courtCount) || courtCount < 1 || courtCount > 10) {
    throw new AppException(
      ErrorCodes.INVALID_COURT_COUNT,
      'A quantidade de quadras deve ser entre 1 e 10.',
    );
  }
  return courtCount;
}

export function validateParticipantName(name: string): string {
  const normalized = normalizeText(name);
  if (!normalized) {
    throw new AppException(
      ErrorCodes.PARTICIPANT_NAME_REQUIRED,
      'Informe o nome do participante.',
    );
  }
  if (normalized.length < 2) {
    throw new AppException(
      ErrorCodes.PARTICIPANT_NAME_REQUIRED,
      'Informe o nome do participante.',
    );
  }
  if (normalized.length > 80) {
    throw new AppException(
      ErrorCodes.VALIDATION_ERROR,
      'O nome do participante deve ter no máximo 80 caracteres.',
    );
  }
  return normalized;
}

export function assertNoDuplicateParticipant(
  participants: Participant[],
  name: string,
  excludeParticipantId?: string,
): void {
  const target = normalizeText(name).toLowerCase();
  const duplicate = participants.find(
    (p) =>
      p.id !== excludeParticipantId &&
      normalizeText(p.name).toLowerCase() === target,
  );
  if (duplicate) {
    throw new AppException(
      ErrorCodes.DUPLICATED_PARTICIPANT,
      'Já existe um participante com este nome.',
      HttpStatus.CONFLICT,
    );
  }
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return startOfDay(new Date(year, month - 1, day));
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
