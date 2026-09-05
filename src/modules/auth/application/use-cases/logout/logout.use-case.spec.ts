import { describe, expect, it } from 'vitest';
import { RefreshSession } from '../../../domain/entities/refresh-session.entity.js';
import {
  RefreshSessionRepository,
  type RotateRefreshSessionInput,
} from '../../../domain/repositories/refresh-session.repository.js';
import type { RefreshTokenHasher } from '../../ports/refresh-token-hasher.js';
import type {
  AccessTokenClaims,
  IssuedToken,
  RefreshTokenClaims,
  TokenService,
} from '../../ports/token-service.js';
import { LogoutUseCase } from './logout.use-case.js';

class Sessions extends RefreshSessionRepository {
  revoked = false;
  constructor(private readonly session: RefreshSession) {
    super();
  }
  async create(_session: RefreshSession): Promise<void> {}
  async findById(id: string): Promise<RefreshSession | null> {
    return id === this.session.id ? this.session : null;
  }
  async rotate(_input: RotateRefreshSessionInput): Promise<boolean> {
    return false;
  }
  async revoke(id: string, userId: string, revokedAt: Date): Promise<boolean> {
    if (id !== this.session.id || userId !== this.session.userId) return false;
    this.session.revoke(revokedAt);
    this.revoked = true;
    return true;
  }
}

const hasher: RefreshTokenHasher = {
  hash: (token) => `hash:${token}`,
  verify: (token, hash) => hash === `hash:${token}`,
};

const tokens: TokenService = {
  async issueAccessToken(): Promise<IssuedToken> {
    throw new Error('unused');
  },
  async issueRefreshToken(): Promise<IssuedToken> {
    throw new Error('unused');
  },
  async verifyAccessToken(): Promise<AccessTokenClaims> {
    throw new Error('unused');
  },
  async verifyRefreshToken(): Promise<RefreshTokenClaims> {
    return {
      userId: '9d4fa61e-d2cf-4c58-8dbd-dce4220df511',
      sessionId: '6cc85d90-6321-4d11-b086-d24afdc7627a',
    };
  },
};

describe('LogoutUseCase', () => {
  it('revokes the refresh session after verifying the token hash', async () => {
    const refreshToken = 'refresh-token';
    const session = RefreshSession.create({
      id: '6cc85d90-6321-4d11-b086-d24afdc7627a',
      userId: '9d4fa61e-d2cf-4c58-8dbd-dce4220df511',
      tokenHash: hasher.hash(refreshToken),
      expiresAt: new Date('2026-09-12T00:00:00.000Z'),
      now: new Date('2026-09-05T00:00:00.000Z'),
    });
    const sessions = new Sessions(session);
    const useCase = new LogoutUseCase(tokens, hasher, sessions, {
      now: () => new Date('2026-09-05T01:00:00.000Z'),
    });

    await useCase.execute({ refreshToken });

    expect(sessions.revoked).toBe(true);
  });
});
