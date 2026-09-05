import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from './api-error-response.dto.js';

export function ApiCommonErrors(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ApiBadRequestResponse({ type: ApiErrorResponseDto }),
    ApiUnauthorizedResponse({ type: ApiErrorResponseDto }),
    ApiForbiddenResponse({ type: ApiErrorResponseDto }),
    ApiTooManyRequestsResponse({ type: ApiErrorResponseDto }),
    ApiInternalServerErrorResponse({ type: ApiErrorResponseDto }),
  );
}
