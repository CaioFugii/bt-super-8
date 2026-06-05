import {
  buildPublicUrl,
  generatePublicToken,
  getPublicTokenExpiresAt,
  isPublicTokenExpired,
} from './public-token.util';

describe('public-token.util', () => {
  it('generatePublicToken retorna 12 caracteres', () => {
    expect(generatePublicToken()).toHaveLength(12);
  });

  it('getPublicTokenExpiresAt define validade de 24h', () => {
    const now = new Date('2026-06-05T12:00:00Z');
    const expires = getPublicTokenExpiresAt(now);
    expect(expires.getTime() - now.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('isPublicTokenExpired detecta expiração', () => {
    expect(isPublicTokenExpired(null)).toBe(true);
    expect(isPublicTokenExpired(new Date(Date.now() - 1000))).toBe(true);
    expect(isPublicTokenExpired(new Date(Date.now() + 60_000))).toBe(false);
  });

  it('buildPublicUrl monta URL pública', () => {
    expect(buildPublicUrl('https://super8.app', 'abc123')).toBe(
      'https://super8.app/t/abc123',
    );
  });
});
