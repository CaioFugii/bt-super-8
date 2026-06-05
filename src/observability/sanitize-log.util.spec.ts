import { sanitizeLogData } from './sanitize-log.util';

describe('sanitizeLogData', () => {
  it('remove campos sensíveis', () => {
    const result = sanitizeLogData({
      email: 'user@test.com',
      password: 'secret',
      accessToken: 'jwt-token',
      passwordHash: 'hash',
      nested: {
        authorization: 'Bearer x',
        userId: '123',
      },
    }) as Record<string, unknown>;

    expect(result.email).toBe('user@test.com');
    expect(result.password).toBeUndefined();
    expect(result.accessToken).toBeUndefined();
    expect(result.passwordHash).toBeUndefined();
    expect((result.nested as Record<string, unknown>).authorization).toBeUndefined();
    expect((result.nested as Record<string, unknown>).userId).toBe('123');
  });
});
