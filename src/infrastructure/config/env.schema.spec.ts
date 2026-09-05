import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.schema.js';

const valid = {
  DATABASE_URL: 'postgresql://app:secret@localhost:5432/app',
  JWT_ACCESS_SECRET: 'access-secret-that-is-at-least-32-characters',
  JWT_REFRESH_SECRET: 'refresh-secret-that-is-at-least-32-characters',
  REFRESH_TOKEN_HASH_SECRET: 'hash-secret-that-is-at-least-32-characters',
};

describe('validateEnv', () => {
  it('fails fast when a required secret is missing', () => {
    const { JWT_ACCESS_SECRET: _missing, ...input } = valid;
    expect(() => validateEnv(input)).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('coerces typed values and applies safe defaults', () => {
    const env = validateEnv({ ...valid, PORT: '4000', SWAGGER_ENABLED: 'true' });
    expect(env.PORT).toBe(4000);
    expect(env.SWAGGER_ENABLED).toBe(true);
    expect(env.JWT_ACCESS_EXPIRES_IN_SECONDS).toBe(900);
  });

  it('rejects reused JWT or refresh-token hashing secrets', () => {
    expect(() => validateEnv({ ...valid, JWT_REFRESH_SECRET: valid.JWT_ACCESS_SECRET })).toThrow(
      /must be different/,
    );

    expect(() =>
      validateEnv({ ...valid, REFRESH_TOKEN_HASH_SECRET: valid.JWT_REFRESH_SECRET }),
    ).toThrow(/must be different/);
  });
});
