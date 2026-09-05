import { describe, expect, it } from 'vitest';
import type { Clock } from '../../../../../shared/application/ports/clock.js';
import type { IdGenerator } from '../../../../../shared/application/ports/id-generator.js';
import { UserRole } from '../../../../users/domain/enums/user-role.enum.js';
import { UserStatus } from '../../../../users/domain/enums/user-status.enum.js';
import type { GetUserUseCase } from '../../../../users/application/use-cases/get-user/get-user.use-case.js';
import { RefreshSession } from '../../../domain/entities/refresh-session.entity.js';
import { RefreshSessionRepository, type RotateRefreshSessionInput } from '../../../domain/repositories/refresh-session.repository.js';
import { InvalidRefreshTokenError } from '../../errors/invalid-refresh-token.error.js';
import type { RefreshTokenHasher } from '../../ports/refresh-token-hasher.js';
import type { AccessTokenClaims, IssuedToken, RefreshTokenClaims, TokenService } from '../../ports/token-service.js';
import { RefreshUseCase } from './refresh.use-case.js';

class FixedClock implements Clock {
  now(): Date { return new Date('2026-09-05T00:00:00.000Z'); }
}

class SequenceIds implements IdGenerator {
  private index = 0;
  private readonly values = ['6cc85d90-6321-4d11-b086-d24afdc7627a', '7dd96ea1-7432-4e22-a197-e35bfed8738b'];
  next(): string { return this.values[this.index++]!; }
}

class FakeHasher implements RefreshTokenHasher {
  hash(token: string): string { return `hash:${token}`; }
  verify(token: string, hash: string): boolean { return hash === this.hash(token); }
}

class FakeTokens implements TokenService {
  async issueAccessToken(input: { userId: string; role: string }): Promise<IssuedToken> {
    return { token: `access:${input.userId}:${input.role}`, expiresAt: new Date('2026-09-05T00:15:00.000Z') };
  }
  async issueRefreshToken(input: { userId: string; sessionId: string }): Promise<IssuedToken> {
    return { token: `refresh:${input.userId}:${input.sessionId}`, expiresAt: new Date('2026-09-12T00:00:00.000Z') };
  }
  async verifyAccessToken(_token: string): Promise<AccessTokenClaims> { throw new Error('unused'); }
  async verifyRefreshToken(token: string): Promise<RefreshTokenClaims> {
    const [kind, userId, sessionId] = token.split(':');
    if (kind !== 'refresh' || !userId || !sessionId) throw new Error('bad token');
    return { userId, sessionId };
  }
}

class InMemorySessions extends RefreshSessionRepository {
  readonly items = new Map<string, RefreshSession>();
  async create(session: RefreshSession): Promise<void> { this.items.set(session.id, session); }
  async findById(id: string): Promise<RefreshSession | null> { return this.items.get(id) ?? null; }
  async revoke(id: string, userId: string, revokedAt: Date): Promise<boolean> {
    const session = this.items.get(id);
    if (!session || session.userId !== userId || !session.isActive(revokedAt)) return false;
    session.revoke(revokedAt);
    return true;
  }
  async rotate(input: RotateRefreshSessionInput): Promise<boolean> {
    const current = this.items.get(input.currentSessionId);
    if (!current || current.userId !== input.userId || current.tokenHash !== input.expectedTokenHash || !current.isActive(input.now)) return false;
    current.revoke(input.now, input.replacement.id);
    this.items.set(input.replacement.id, input.replacement);
    return true;
  }
}

const getUser = {
  async execute() {
    return {
      id: '9d4fa61e-d2cf-4c58-8dbd-dce4220df511',
      email: 'user@example.com',
      name: 'Alice',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt: new Date('2026-09-05T00:00:00.000Z'),
      updatedAt: new Date('2026-09-05T00:00:00.000Z'),
    };
  },
} as unknown as GetUserUseCase;

describe('RefreshUseCase', () => {
  it('rotates a refresh token exactly once', async () => {
    const sessions = new InMemorySessions();
    const tokens = new FakeTokens();
    const ids = new SequenceIds();
    const hasher = new FakeHasher();
    const clock = new FixedClock();
    const userId = '9d4fa61e-d2cf-4c58-8dbd-dce4220df511';
    const currentSessionId = ids.next();
    const currentToken = `refresh:${userId}:${currentSessionId}`;
    await sessions.create(
      RefreshSession.create({
        id: currentSessionId,
        userId,
        tokenHash: hasher.hash(currentToken),
        expiresAt: new Date('2026-09-12T00:00:00.000Z'),
        now: clock.now(),
      }),
    );
    const useCase = new RefreshUseCase(tokens, hasher, sessions, getUser, ids, clock);

    const result = await useCase.execute({ refreshToken: currentToken });

    expect(result.refreshToken).toContain('7dd96ea1-7432-4e22-a197-e35bfed8738b');
    await expect(useCase.execute({ refreshToken: currentToken })).rejects.toThrow(InvalidRefreshTokenError);
  });
});
