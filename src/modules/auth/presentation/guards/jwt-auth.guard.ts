import { Inject, Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../../shared/presentation/security/security-metadata.js';
import type { RequestPrincipal } from '../../../../shared/presentation/security/request-principal.js';
import { TokenService } from '../../application/ports/token-service.js';

interface RequestWithPrincipal {
  headers: { authorization?: string };
  user?: RequestPrincipal;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(TokenService) private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestWithPrincipal>();
    const token = extractBearerToken(request.headers.authorization);
    if (!token) throw new UnauthorizedException('Unauthorized');

    try {
      request.user = await this.tokens.verifyAccessToken(token);
      return true;
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
  }
}

function extractBearerToken(authorization?: string): string | null {
  if (!authorization) return null;
  const [scheme, token, ...rest] = authorization.trim().split(/\s+/);
  if (scheme !== 'Bearer' || !token || rest.length > 0) return null;
  return token;
}
