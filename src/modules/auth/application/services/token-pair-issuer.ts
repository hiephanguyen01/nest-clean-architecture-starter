import type { Clock } from '../../../../shared/application/ports/clock.js';
import type { IdGenerator } from '../../../../shared/application/ports/id-generator.js';
import { RefreshSession } from '../../domain/entities/refresh-session.entity.js';
import type { RefreshSessionRepository } from '../../domain/repositories/refresh-session.repository.js';
import type { RefreshTokenHasher } from '../ports/refresh-token-hasher.js';
import type { TokenService } from '../ports/token-service.js';

export interface AuthTokensOutput {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export class TokenPairIssuer {
  constructor(
    private readonly tokens: TokenService,
    private readonly refreshTokenHasher: RefreshTokenHasher,
    private readonly sessions: RefreshSessionRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async issue(input: { userId: string; role: string }): Promise<AuthTokensOutput> {
    const sessionId = this.ids.next();
    const [access, refresh] = await Promise.all([
      this.tokens.issueAccessToken({ userId: input.userId, role: input.role }),
      this.tokens.issueRefreshToken({ userId: input.userId, sessionId }),
    ]);

    await this.sessions.create(
      RefreshSession.create({
        id: sessionId,
        userId: input.userId,
        tokenHash: this.refreshTokenHasher.hash(refresh.token),
        expiresAt: refresh.expiresAt,
        now: this.clock.now(),
      }),
    );

    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshTokenExpiresAt: refresh.expiresAt,
    };
  }
}
