import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { UserRole } from '../../../users/domain/enums/user-role.enum.js';
import { RolesGuard } from './roles.guard.js';

function contextWithRole(role: string): ExecutionContext {
  return {
    getHandler: () => contextWithRole,
    getClass: () => class TestController {},
    switchToHttp: () => ({
      getRequest: () => ({ user: { userId: 'user-id', role } }),
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows a principal with an allowed role', () => {
    const reflector = {
      getAllAndOverride: (key: string) => (key === 'security:roles' ? [UserRole.ADMIN] : false),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(contextWithRole(UserRole.ADMIN))).toBe(true);
  });

  it('denies a principal without an allowed role', () => {
    const reflector = {
      getAllAndOverride: (key: string) => (key === 'security:roles' ? [UserRole.ADMIN] : false),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(contextWithRole(UserRole.USER))).toBe(false);
  });
});
