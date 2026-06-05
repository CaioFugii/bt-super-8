export enum TournamentFormat {
  SUPER_8 = 'SUPER_8',
  SUPER_8_MIXED = 'SUPER_8_MIXED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export enum MatchStatus {
  PENDING = 'PENDING',
  FINISHED = 'FINISHED',
  WALKOVER = 'WALKOVER',
  CANCELLED = 'CANCELLED',
}

export enum WinnerTeam {
  TEAM_A = 'TEAM_A',
  TEAM_B = 'TEAM_B',
}

export enum ParticipantStatus {
  ACTIVE = 'ACTIVE',
  WITHDRAWN = 'WITHDRAWN',
}

export enum ForfeitChallengeMode {
  RANDOM = 'RANDOM',
  CUSTOM = 'CUSTOM',
}
