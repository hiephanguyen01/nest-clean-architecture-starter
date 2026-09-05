import type { UserOutput } from '../../../users/application/contracts/user-output.js';
import type { AuthTokensOutput } from '../../application/services/token-pair-issuer.js';
import type {
  AuthSessionResponseDto,
  AuthTokensResponseDto,
  AuthUserResponseDto,
} from '../dto/auth-response.dto.js';

export class AuthPresenter {
  static user(user: UserOutput): AuthUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  static tokens(tokens: AuthTokensOutput): AuthTokensResponseDto {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
    };
  }

  static session(input: { user: UserOutput; tokens: AuthTokensOutput }): AuthSessionResponseDto {
    return { user: this.user(input.user), tokens: this.tokens(input.tokens) };
  }
}
