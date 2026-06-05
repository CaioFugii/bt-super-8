import { randomBytes } from 'crypto';

const TOKEN_LENGTH = 12;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function generatePublicToken(): string {
  return randomBytes(9).toString('base64url').slice(0, TOKEN_LENGTH);
}

export function getPublicTokenExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + TOKEN_TTL_MS);
}

export function isPublicTokenExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() <= Date.now();
}

export function buildPublicUrl(baseUrl: string, publicToken: string): string {
  const base = baseUrl.replace(/\/$/, '');
  return `${base}/t/${publicToken}`;
}
