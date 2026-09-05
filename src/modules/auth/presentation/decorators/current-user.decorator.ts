import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { RequestPrincipal } from '../../../../shared/presentation/security/request-principal.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestPrincipal => {
    const request = context.switchToHttp().getRequest<{ user: RequestPrincipal }>();
    return request.user;
  },
);
