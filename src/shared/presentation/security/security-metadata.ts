import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'security:is-public';
export const ROLES_KEY = 'security:roles';

export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
