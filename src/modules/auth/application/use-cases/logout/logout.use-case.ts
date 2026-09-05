import type { Clock } from '../../../../../shared/application/ports/clock.js';
import type { RefreshSessionRepository } from '../../../domain/repositories/refresh-session.repository.js';
import { InvalidRefreshTokenError } from '../../errors/invalid-refresh-token.error.js';
import type { RefreshTokenHasher } from '../../ports/refresh-token-hasher.js';
import type { TokenService } from '../../ports/token-service.js';

export interface LogoutInput {
  refreshToken: string;
}

export class LogoutUseCase {
  constructor(
    private readonly tokens: TokenService,
    private readonly refreshTokenHasher: RefreshTokenHasher,
    private readonly sessions: RefreshSessionRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    let claims;
    try {
      claims = await this.tokens.verifyRefreshToken(input.refreshToken);
    } catch {
      throw new InvalidRefreshTokenError();
    }

    const now = this.clock.now();
    const session = await this.sessions.findById(claims.sessionId);
    if (
      !session ||
      session.userId !== claims.userId ||
      !session.isActive(now) ||
      !this.refreshTokenHasher.verify(input.refreshToken, session.tokenHash)
    ) {
      throw new InvalidRefreshTokenError();
    }

    const revoked = await this.sessions.revoke(session.id, session.userId, now);
    if (!revoked) {
      throw new InvalidRefreshTokenError();
    }
  }
}
