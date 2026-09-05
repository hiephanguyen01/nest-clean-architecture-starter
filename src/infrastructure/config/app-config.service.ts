import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.schema.js';

@Injectable()
export class AppConfigService {
  constructor(@Inject(ConfigService) private readonly config: ConfigService<Env, true>) {}

  get nodeEnv(): Env['NODE_ENV'] {
    return this.config.get('NODE_ENV', { infer: true });
  }
  get port(): number {
    return this.config.get('PORT', { infer: true });
  }
  get databaseUrl(): string {
    return this.config.get('DATABASE_URL', { infer: true });
  }
  get jwtAccessSecret(): string {
    return this.config.get('JWT_ACCESS_SECRET', { infer: true });
  }
  get jwtAccessExpiresInSeconds(): number {
    return this.config.get('JWT_ACCESS_EXPIRES_IN_SECONDS', { infer: true });
  }
  get jwtRefreshSecret(): string {
    return this.config.get('JWT_REFRESH_SECRET', { infer: true });
  }
  get jwtRefreshExpiresInSeconds(): number {
    return this.config.get('JWT_REFRESH_EXPIRES_IN_SECONDS', { infer: true });
  }
  get jwtIssuer(): string {
    return this.config.get('JWT_ISSUER', { infer: true });
  }
  get jwtAudience(): string {
    return this.config.get('JWT_AUDIENCE', { infer: true });
  }
  get refreshTokenHashSecret(): string {
    return this.config.get('REFRESH_TOKEN_HASH_SECRET', { infer: true });
  }
  get swaggerEnabled(): boolean {
    return this.config.get('SWAGGER_ENABLED', { infer: true });
  }
  get swaggerPath(): string {
    return this.config.get('SWAGGER_PATH', { infer: true });
  }
  get trustProxy(): boolean {
    return this.config.get('TRUST_PROXY', { infer: true });
  }
  get logLevel(): Env['LOG_LEVEL'] {
    return this.config.get('LOG_LEVEL', { infer: true });
  }
  get rateLimitTtlMs(): number {
    return this.config.get('RATE_LIMIT_TTL_MS', { infer: true });
  }
  get rateLimitLimit(): number {
    return this.config.get('RATE_LIMIT_LIMIT', { infer: true });
  }
  get requestBodyLimit(): string {
    return this.config.get('REQUEST_BODY_LIMIT', { infer: true });
  }

  get corsOrigins(): string[] {
    return this.config
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((origin: string) => origin.trim())
      .filter(Boolean);
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
