const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'accesstoken',
  'access_token',
  'token',
  'authorization',
  'jwt',
  'refreshtoken',
  'refresh_token',
  'secret',
  'creditcard',
  'cardnumber',
]);

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-_]/g, '');
  return SENSITIVE_KEYS.has(normalized);
}

export function sanitizeLogData(
  value: unknown,
  depth = 0,
): unknown {
  if (depth > 5 || value == null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogData(item, depth + 1));
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (isSensitiveKey(key)) {
        continue;
      }
      result[key] = sanitizeLogData(nested, depth + 1);
    }
    return result;
  }

  return value;
}
