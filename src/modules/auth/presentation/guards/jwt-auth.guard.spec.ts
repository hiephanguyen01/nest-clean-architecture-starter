import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import type { TokenService } from '../../application/ports/token-service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

function httpContext(authorization?: string): {
  context: ExecutionContext;
  request: { headers: { authorization?: string }; user?: unknown };
} {
  const request: { headers: { authorization?: string }; user?: unknown } = { headers: {} };
  if (authorization) request.headers.authorization = authorization;
  const context = {
    getHandler: () => httpContext,
    getClass: () => class TestController {},
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('JwtAuthGuard', () => {
  it('attaches verified principal to the request', async () => {
    const tokenService = {
      verifyAccessToken: async () => ({ userId: 'user-id', role: 'USER' }),
    } as unknown as TokenService;
    const reflector = { getAllAndOverride: () => false } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector, tokenService);
    const { context, request } = httpContext('Bearer valid-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ userId: 'user-id', role: 'USER' });
  });
});
