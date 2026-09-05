import type { Clock } from '../../../../../shared/application/ports/clock.js';
import type { IdGenerator } from '../../../../../shared/application/ports/id-generator.js';
import type { GetUserUseCase } from '../../../../users/application/use-cases/get-user/get-user.use-case.js';
import { UserStatus } from '../../../../users/domain/enums/user-status.enum.js';
import { RefreshSession } from '../../../domain/entities/refresh-session.entity.js';
import type { RefreshSessionRepository } from '../../../domain/repositories/refresh-session.repository.js';
import { AccountUnavailableError } from '../../errors/account-unavailable.error.js';
import { InvalidRefreshTokenError } from '../../errors/invalid-refresh-token.error.js';
import type { RefreshTokenHasher } from '../../ports/refresh-token-hasher.js';
import type { TokenService } from '../../ports/token-service.js';
import type { AuthTokensOutput } from '../../services/token-pair-issuer.js';

export interface RefreshInput {
  refreshToken: string;
}

export class RefreshUseCase {
  constructor(
    private readonly tokens: TokenService,
    private readonly refreshTokenHasher: RefreshTokenHasher,
    private readonly sessions: RefreshSessionRepository,
    private readonly getUser: GetUserUseCase,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: RefreshInput): Promise<AuthTokensOutput> {
    const claims = await this.verifyClaims(input.refreshToken);
    const now = this.clock.now();
    const current = await this.sessions.findById(claims.sessionId);

    if (
      !current ||
      current.userId !== claims.userId ||
      !current.isActive(now) ||
      !this.refreshTokenHasher.verify(input.refreshToken, current.tokenHash)
    ) {
      throw new InvalidRefreshTokenError();
    }

    let user;
    try {
      user = await this.getUser.execute({ id: claims.userId });
    } catch {
      throw new InvalidRefreshTokenError();
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new AccountUnavailableError();
    }

    const replacementId = this.ids.next();
    const replacementRefresh = await this.tokens.issueRefreshToken({
      userId: user.id,
      sessionId: replacementId,
    });
    const replacement = RefreshSession.create({
      id: replacementId,
      userId: user.id,
      tokenHash: this.refreshTokenHasher.hash(replacementRefresh.token),
      expiresAt: replacementRefresh.expiresAt,
      now,
    });

    const access = await this.tokens.issueAccessToken({ userId: user.id, role: user.role });
    const rotated = await this.sessions.rotate({
      currentSessionId: current.id,
      userId: current.userId,
      expectedTokenHash: current.tokenHash,
      replacement,
      now,
    });
    if (!rotated) {
      throw new InvalidRefreshTokenError();
    }

    return {
      accessToken: access.token,
      refreshToken: replacementRefresh.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshTokenExpiresAt: replacementRefresh.expiresAt,
    };
  }

  private async verifyClaims(refreshToken: string) {
    try {
      return await this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      throw new InvalidRefreshTokenError();
    }
  }
}
