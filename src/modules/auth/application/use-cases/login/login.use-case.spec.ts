import { describe, expect, it } from 'vitest';
import { UserRole } from '../../../../users/domain/enums/user-role.enum.js';
import { UserStatus } from '../../../../users/domain/enums/user-status.enum.js';
import { UserNotFoundError } from '../../../../users/application/errors/user-not-found.error.js';
import type { GetUserAuthenticationDataUseCase } from '../../../../users/application/use-cases/get-user-authentication-data/get-user-authentication-data.use-case.js';
import { AccountUnavailableError } from '../../errors/account-unavailable.error.js';
import { InvalidCredentialsError } from '../../errors/invalid-credentials.error.js';
import type { PasswordHasher } from '../../ports/password-hasher.js';
import type { TokenPairIssuer } from '../../services/token-pair-issuer.js';
import { LoginUseCase } from './login.use-case.js';

class StubUsers {
  constructor(private readonly mode: 'ok' | 'missing' | 'blocked') {}
  async execute() {
    if (this.mode === 'missing') throw new UserNotFoundError();
    return {
      id: '9d4fa61e-d2cf-4c58-8dbd-dce4220df511',
      email: 'user@example.com',
      name: 'Alice',
      role: UserRole.USER,
      status: this.mode === 'blocked' ? UserStatus.BLOCKED : UserStatus.ACTIVE,
      passwordHash: 'hashed:secret',
      createdAt: new Date('2026-09-05T00:00:00.000Z'),
      updatedAt: new Date('2026-09-05T00:00:00.000Z'),
    };
  }
}

class FakePasswordHasher implements PasswordHasher {
  async hash(value: string): Promise<string> { return `hashed:${value}`; }
  async verify(value: string, hash: string): Promise<boolean> { return hash === `hashed:${value}`; }
}

const fakeIssuer = {
  async issue() {
    return {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresAt: new Date('2026-09-05T00:15:00.000Z'),
      refreshTokenExpiresAt: new Date('2026-09-12T00:00:00.000Z'),
    };
  },
} as unknown as TokenPairIssuer;

describe('LoginUseCase', () => {
  it('does not disclose whether an email exists', async () => {
    const useCase = new LoginUseCase(
      new StubUsers('missing') as unknown as GetUserAuthenticationDataUseCase,
      new FakePasswordHasher(),
      fakeIssuer,
    );

    await expect(useCase.execute({ email: 'missing@example.com', password: 'secret' })).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it('rejects a wrong password', async () => {
    const useCase = new LoginUseCase(
      new StubUsers('ok') as unknown as GetUserAuthenticationDataUseCase,
      new FakePasswordHasher(),
      fakeIssuer,
    );

    await expect(useCase.execute({ email: 'user@example.com', password: 'wrong' })).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it('rejects a blocked account after valid credentials', async () => {
    const useCase = new LoginUseCase(
      new StubUsers('blocked') as unknown as GetUserAuthenticationDataUseCase,
      new FakePasswordHasher(),
      fakeIssuer,
    );

    await expect(useCase.execute({ email: 'user@example.com', password: 'secret' })).rejects.toThrow(
      AccountUnavailableError,
    );
  });

  it('returns a token pair for an active user with valid credentials', async () => {
    const useCase = new LoginUseCase(
      new StubUsers('ok') as unknown as GetUserAuthenticationDataUseCase,
      new FakePasswordHasher(),
      fakeIssuer,
    );

    const result = await useCase.execute({ email: 'user@example.com', password: 'secret' });

    expect(result.tokens.accessToken).toBe('access-token');
    expect(result.user.email).toBe('user@example.com');
  });
});
