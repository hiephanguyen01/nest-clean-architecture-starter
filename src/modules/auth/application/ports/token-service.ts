export interface IssuedToken {
  token: string;
  expiresAt: Date;
}

export interface AccessTokenClaims {
  userId: string;
  role: string;
}

export interface RefreshTokenClaims {
  userId: string;
  sessionId: string;
}

export abstract class TokenService {
  abstract issueAccessToken(input: { userId: string; role: string }): Promise<IssuedToken>;
  abstract issueRefreshToken(input: { userId: string; sessionId: string }): Promise<IssuedToken>;
  abstract verifyAccessToken(token: string): Promise<AccessTokenClaims>;
  abstract verifyRefreshToken(token: string): Promise<RefreshTokenClaims>;
}
