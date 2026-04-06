/**
 * Удаляет из объекта поля с секретами перед логированием (рекурсивно).
 */
const SENSITIVE_KEYS = new Set(
  [
    'password',
    'passwordhash',
    'password_hash',
    'currentpassword',
    'current_password',
    'newpassword',
    'new_password',
    'token',
    'accesstoken',
    'access_token',
    'refreshtoken',
    'refresh_token',
    'authorization',
    'cookie',
    'secret',
    'jwt_secret',
    'smtp_pass',
    'smtppass',
    'apikey',
    'api_key',
  ].map((k) => k.toLowerCase()),
);

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (SENSITIVE_KEYS.has(lower)) return true;
  if (lower.includes('password')) return true;
  if (lower.includes('secret') && !lower.includes('message')) return true;
  return false;
}

export function sanitizeForLog(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLog(item));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (isSensitiveKey(k)) {
      out[k] = '[redacted]';
    } else {
      out[k] = sanitizeForLog(v);
    }
  }
  return out;
}
