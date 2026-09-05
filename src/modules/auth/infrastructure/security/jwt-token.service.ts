import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { jwtVerify, SignJWT } from 'jose';
import { AppConfigService } from '../../../../infrastructure/config/app-config.service.js';
import {
  TokenService,
  type AccessTokenClaims,
  type IssuedToken,
  type RefreshTokenClaims,
} from '../../application/ports/token-service.js';

@Injectable()
export class JwtTokenService implements TokenService {
  private readonly encoder = new TextEncoder();

  constructor(@Inject(AppConfigService) private readonly config: AppConfigService) {}

  async issueAccessToken(input: { userId: string; role: string }): Promise<IssuedToken> {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAtSeconds = issuedAt + this.config.jwtAccessExpiresInSeconds;
    const token = await new SignJWT({ role: input.role, tokenType: 'access' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(input.userId)
      .setJti(randomUUID())
      .setIssuer(this.config.jwtIssuer)
      .setAudience(this.config.jwtAudience)
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAtSeconds)
      .sign(this.encoder.encode(this.config.jwtAccessSecret));
    return { token, expiresAt: new Date(expiresAtSeconds * 1000) };
  }

  async issueRefreshToken(input: { userId: string; sessionId: string }): Promise<IssuedToken> {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAtSeconds = issuedAt + this.config.jwtRefreshExpiresInSeconds;
    const token = await new SignJWT({ sid: input.sessionId, tokenType: 'refresh' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(input.userId)
      .setJti(randomUUID())
      .setIssuer(this.config.jwtIssuer)
      .setAudience(this.config.jwtAudience)
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAtSeconds)
      .sign(this.encoder.encode(this.config.jwtRefreshSecret));
    return { token, expiresAt: new Date(expiresAtSeconds * 1000) };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    const { payload } = await jwtVerify(token, this.encoder.encode(this.config.jwtAccessSecret), {
      issuer: this.config.jwtIssuer,
      audience: this.config.jwtAudience,
      algorithms: ['HS256'],
    });
    if (payload.tokenType !== 'access' || typeof payload.sub !== 'string' || typeof payload.role !== 'string') {
      throw new Error('Invalid access token claims');
    }
    return { userId: payload.sub, role: payload.role };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenClaims> {
    const { payload } = await jwtVerify(token, this.encoder.encode(this.config.jwtRefreshSecret), {
      issuer: this.config.jwtIssuer,
      audience: this.config.jwtAudience,
      algorithms: ['HS256'],
    });
    if (payload.tokenType !== 'refresh' || typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
      throw new Error('Invalid refresh token claims');
    }
    return { userId: payload.sub, sessionId: payload.sid };
  }
}
