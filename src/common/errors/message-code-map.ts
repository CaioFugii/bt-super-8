import { ErrorCodes } from './error-codes';

const EXACT_MAP: Record<string, { code: string; message?: string }> = {
  'Torneio não encontrado': { code: ErrorCodes.TOURNAMENT_NOT_FOUND },
  'Participante não encontrado': { code: ErrorCodes.PARTICIPANT_NOT_FOUND },
  'Partida não encontrada': { code: ErrorCodes.MATCH_NOT_FOUND },
  'Este torneio já possui partidas geradas': {
    code: ErrorCodes.MATCHES_ALREADY_GENERATED,
    message: 'As partidas deste torneio já foram geradas.',
  },
  'Torneio finalizado não pode ser cancelado': {
    code: ErrorCodes.TOURNAMENT_ALREADY_FINISHED,
    message: 'Não é possível alterar um torneio finalizado.',
  },
  'Partida já finalizada ou cancelada': {
    code: ErrorCodes.MATCH_ALREADY_FINISHED,
    message: 'Esta partida já foi finalizada.',
  },
  'O Super 8 exige exatamente 8 participantes cadastrados': {
    code: ErrorCodes.INVALID_PARTICIPANT_COUNT,
    message: 'O torneio deve possuir exatamente 8 participantes.',
  },
  'O Super 8 Misto exige exatamente 8 participantes cadastrados': {
    code: ErrorCodes.INVALID_PARTICIPANT_COUNT,
    message: 'O torneio deve possuir exatamente 8 participantes.',
  },
  'O Super 8 Misto exige exatamente 4 homens e 4 mulheres': {
    code: ErrorCodes.INVALID_MIXED_GENDER_DISTRIBUTION,
    message: 'O Super 8 Misto exige exatamente 4 homens e 4 mulheres.',
  },
  'Já existe um participante com este nome.': {
    code: ErrorCodes.DUPLICATED_PARTICIPANT,
  },
  'A data do torneio não pode estar no passado.': {
    code: ErrorCodes.TOURNAMENT_DATE_IN_PAST,
  },
  'Todas as partidas devem estar finalizadas ou com W.O. antes de encerrar o torneio.': {
    code: ErrorCodes.TOURNAMENT_CANNOT_BE_FINISHED,
    message:
      'Todas as partidas devem estar finalizadas ou com W.O. antes de encerrar o torneio.',
  },
  'O placar não pode terminar em empate': {
    code: ErrorCodes.INVALID_SCORE,
    message: 'Informe um placar válido.',
  },
  'Credenciais inválidas': {
    code: ErrorCodes.UNAUTHENTICATED,
    message: 'Faça login para continuar.',
  },
  'Já existe um organizador com este e-mail.': {
    code: ErrorCodes.DUPLICATE_ORGANIZER_EMAIL,
  },
  'Organizador não encontrado.': {
    code: ErrorCodes.ORGANIZER_NOT_FOUND,
  },
  'Acesso negado.': {
    code: ErrorCodes.FORBIDDEN,
  },
  'Usuário inativo. Entre em contato com o administrador.': {
    code: ErrorCodes.USER_INACTIVE,
    message: 'Usuário inativo. Entre em contato com o administrador.',
  },
  Unauthorized: {
    code: ErrorCodes.UNAUTHENTICATED,
    message: 'Faça login para continuar.',
  },
  REVOKED: {
    code: ErrorCodes.PUBLIC_LINK_REVOKED,
    message: 'Este link não está mais disponível.',
  },
  EXPIRED: {
    code: ErrorCodes.PUBLIC_LINK_EXPIRED,
    message: 'Link expirado. Solicite um novo link ao organizador.',
  },
  NOT_FOUND: {
    code: ErrorCodes.PUBLIC_LINK_INVALID,
    message: 'Torneio não encontrado.',
  },
};

const PATTERN_MAP: Array<{
  test: (message: string) => boolean;
  code: string;
  message?: string;
}> = [
  {
    test: (m) => m.startsWith('Não é possível ') && m.includes('rascunho'),
    code: ErrorCodes.TOURNAMENT_ALREADY_STARTED,
    message: 'Não é possível alterar este torneio após o início.',
  },
  {
    test: (m) => m.includes('torneio em andamento ou finalizado'),
    code: ErrorCodes.TOURNAMENT_ALREADY_STARTED,
    message: 'Não é possível alterar este torneio após o início.',
  },
  {
    test: (m) => m.includes('placar') || m.includes('Placar'),
    code: ErrorCodes.INVALID_SCORE,
    message: 'Informe um placar válido.',
  },
];

export function mapMessageToError(message: string): {
  code: string;
  message: string;
} {
  const exact = EXACT_MAP[message];
  if (exact) {
    return {
      code: exact.code,
      message: exact.message ?? message,
    };
  }

  for (const rule of PATTERN_MAP) {
    if (rule.test(message)) {
      return {
        code: rule.code,
        message: rule.message ?? message,
      };
    }
  }

  return {
    code: ErrorCodes.BUSINESS_RULE_ERROR,
    message,
  };
}
