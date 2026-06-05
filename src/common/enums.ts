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

export enum UserRole {
  ORGANIZER = 'ORGANIZER',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
}

export enum OrganizerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum AdminAuditAction {
  CREATE_ORGANIZER = 'CREATE_ORGANIZER',
  UPDATE_ORGANIZER = 'UPDATE_ORGANIZER',
  ACTIVATE_ORGANIZER = 'ACTIVATE_ORGANIZER',
  DEACTIVATE_ORGANIZER = 'DEACTIVATE_ORGANIZER',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

export enum ForfeitChallengeMode {
  RANDOM = 'RANDOM',
  CUSTOM = 'CUSTOM',
}
