import { ErrorCodes } from './error-codes';

const EXACT_MAP: Record<string, { code: string; message?: string }> = {
  'Torneio não encontrado': {
    code: ErrorCodes.TOURNAMENT_NOT_FOUND,
    message: 'Não encontramos este torneio. Verifique se ele ainda existe.',
  },
  'Participante não encontrado': {
    code: ErrorCodes.PARTICIPANT_NOT_FOUND,
    message: 'Não encontramos este participante. Ele pode ter sido removido.',
  },
  'Partida não encontrada': {
    code: ErrorCodes.MATCH_NOT_FOUND,
    message: 'Não encontramos esta partida. Atualize a tela e tente novamente.',
  },
  'Este torneio já possui partidas geradas': {
    code: ErrorCodes.MATCHES_ALREADY_GENERATED,
    message:
      'As partidas deste torneio já foram geradas e não podem ser geradas novamente.',
  },
  'Torneio finalizado não pode ser cancelado': {
    code: ErrorCodes.TOURNAMENT_ALREADY_FINISHED,
    message:
      'Este torneio já foi finalizado e não pode mais ser alterado ou cancelado.',
  },
  'Partida já finalizada ou cancelada': {
    code: ErrorCodes.MATCH_ALREADY_FINISHED,
    message: 'Esta partida já foi finalizada ou cancelada e não aceita alterações.',
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
    message:
      'Já existe um participante com este nome neste torneio. Use outro nome para continuar.',
  },
  'A data do torneio não pode estar no passado.': {
    code: ErrorCodes.TOURNAMENT_DATE_IN_PAST,
    message:
      'A data do torneio está no passado. Informe uma data de hoje em diante.',
  },
  'Todas as partidas devem estar finalizadas ou com W.O. antes de encerrar o torneio.': {
    code: ErrorCodes.TOURNAMENT_CANNOT_BE_FINISHED,
    message:
      'Todas as partidas devem estar finalizadas ou com W.O. antes de encerrar o torneio.',
  },
  'O placar não pode terminar em empate': {
    code: ErrorCodes.INVALID_SCORE,
    message: 'Placar inválido: partidas não podem terminar empatadas.',
  },
  'Credenciais inválidas': {
    code: ErrorCodes.UNAUTHENTICATED,
    message: 'E-mail ou senha inválidos. Confira os dados e tente novamente.',
  },
  'Já existe um organizador com este e-mail.': {
    code: ErrorCodes.DUPLICATE_ORGANIZER_EMAIL,
    message:
      'Este e-mail já está cadastrado para outro organizador. Use outro e-mail ou faça login.',
  },
  'Organizador não encontrado.': {
    code: ErrorCodes.ORGANIZER_NOT_FOUND,
    message: 'Organizador não encontrado. Verifique os dados informados.',
  },
  'Acesso negado.': {
    code: ErrorCodes.FORBIDDEN,
    message:
      'Você não tem permissão para realizar esta ação neste torneio.',
  },
  'Usuário inativo. Entre em contato com o administrador.': {
    code: ErrorCodes.USER_INACTIVE,
    message: 'Usuário inativo. Entre em contato com o administrador.',
  },
  Unauthorized: {
    code: ErrorCodes.UNAUTHENTICATED,
    message: 'Sua sessão expirou. Faça login novamente para continuar.',
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
    message: 'Este link é inválido ou não existe mais.',
  },
};

const PATTERN_MAP: Array<{
  test: (message: string) => boolean;
  code: string;
  message?: string;
}> = [
  {
    test: (m) =>
      m.includes('name must be longer than or equal to 2 characters'),
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'O nome deve ter pelo menos 2 caracteres.',
  },
  {
    test: (m) =>
      m.includes('name must be longer than or equal to 3 characters'),
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'O nome do torneio deve ter pelo menos 3 caracteres.',
  },
  {
    test: (m) => m.includes('name must be shorter than or equal to 100 characters'),
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'O nome do torneio pode ter no máximo 100 caracteres.',
  },
  {
    test: (m) => m.includes('name must be shorter than or equal to 80 characters'),
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'O nome do participante pode ter no máximo 80 caracteres.',
  },
  {
    test: (m) => m.includes('email must be an email'),
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'Informe um e-mail valido.',
  },
  {
    test: (m) => m.includes('password must be longer than or equal to 6 characters'),
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'A senha deve ter pelo menos 6 caracteres.',
  },
  {
    test: (m) => m.includes('date must be a valid ISO 8601 date string'),
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'Informe uma data valida.',
  },
  {
    test: (m) =>
      m.includes('courtCount must not be less than 1') ||
      m.includes('courtCount must not be greater than 10'),
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'Quantidade de quadras deve ser entre 1 e 10.',
  },
  {
    test: (m) => m.includes('walkoverScoreWinner must not be less than 0'),
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'O placar de W.O. do vencedor deve ser maior ou igual a 0.',
  },
  {
    test: (m) => m.includes('walkoverScoreLoser must not be less than 0'),
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'O placar de W.O. do perdedor deve ser maior ou igual a 0.',
  },
  {
    test: (m) =>
      m.includes('walkoverScoreWinner must be an integer number') ||
      m.includes('walkoverScoreLoser must be an integer number') ||
      m.includes('courtCount must be an integer number'),
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'Informe valores inteiros validos para os campos numericos.',
  },
  {
    test: (m) =>
      m.includes('scoreLimit must be one of the following values: 4, 6'),
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'Games por set deve ser 4 ou 6.',
  },
  {
    test: (m) =>
      m.includes('hasTieBreak must be a boolean value') ||
      m.includes('enableForfeitChallenge must be a boolean value'),
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'Valor invalido para chave de ativacao. Atualize a tela e tente novamente.',
  },
  {
    test: (m) =>
      m.includes('customChallenges must be an array') ||
      m.includes('customChallenges must contain at least 1 elements'),
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'Informe ao menos uma prenda personalizada valida.',
  },
  {
    test: (m) => m.includes('property') && m.includes('should not exist'),
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'Foram enviados campos invalidos. Atualize a tela e tente novamente.',
  },
  {
    test: (m) =>
      m.includes('teamAScore must not be less than 0') ||
      m.includes('teamBScore must not be less than 0'),
    code: ErrorCodes.INVALID_SCORE,
    message:
      'Informe os dois placares com valores inteiros maiores ou iguais a 0.',
  },
  {
    test: (m) =>
      m.includes('teamAScore must be an integer number') ||
      m.includes('teamBScore must be an integer number'),
    code: ErrorCodes.INVALID_SCORE,
    message:
      'Informe os dois placares com valores inteiros maiores ou iguais a 0.',
  },
  {
    test: (m) => m.startsWith('Não é possível ') && m.includes('rascunho'),
    code: ErrorCodes.TOURNAMENT_ALREADY_STARTED,
    message:
      'Não é possível alterar este torneio porque ele já foi iniciado e saiu de rascunho.',
  },
  {
    test: (m) => m.includes('torneio em andamento ou finalizado'),
    code: ErrorCodes.TOURNAMENT_ALREADY_STARTED,
    message:
      'Não é possível alterar este torneio porque ele está em andamento ou já foi finalizado.',
  },
  {
    test: (m) => m.includes('placar') || m.includes('Placar'),
    code: ErrorCodes.INVALID_SCORE,
    message:
      'Placar inválido. Revise os valores informados e tente novamente.',
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
