import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ValidationFailureError, type ValidationErrorDetail } from '../errors/validation-failure.error.js';

const STATUS_BY_CODE: Readonly<Record<string, number>> = {
  VALIDATION_ERROR: 400,
  INVALID_EMAIL: 400,
  INVALID_USER_ID: 400,
  INVALID_USER_NAME: 400,
  WEAK_PASSWORD: 400,
  EMAIL_ALREADY_EXISTS: 409,
  USER_NOT_FOUND: 404,
  INVALID_CREDENTIALS: 401,
  INVALID_REFRESH_TOKEN: 401,
  ACCOUNT_UNAVAILABLE: 403,
};

interface ErrorEnvelope {
  statusCode: number;
  code: string;
  message: string;
  errors: ValidationErrorDetail[];
  timestamp: string;
  path: string;
  requestId?: string;
}

interface HttpRequestLike {
  url: string;
  id?: string;
}

interface HttpResponseLike {
  status(statusCode: number): this;
  json(body: ErrorEnvelope): void;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(HttpExceptionFilter.name) private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<HttpRequestLike>();
    const response = ctx.getResponse<HttpResponseLike>();
    const code = getErrorCode(exception);
    const statusCode = getStatusCode(exception, code);
    const message = getSafeMessage(exception, statusCode);
    const body: ErrorEnvelope = {
      statusCode,
      code,
      message,
      errors: exception instanceof ValidationFailureError ? exception.errors : [],
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(request.id ? { requestId: request.id } : {}),
    };

    if (statusCode >= 500) {
      const error = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error({ err: error, requestId: request.id, path: request.url }, 'Unhandled request error');
    }

    response.status(statusCode).json(body);
  }
}

function getErrorCode(exception: unknown): string {
  if (exception && typeof exception === 'object' && 'code' in exception) {
    const code = (exception as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  if (exception instanceof HttpException) {
    return statusToCode(exception.getStatus());
  }
  return 'INTERNAL_SERVER_ERROR';
}

function getStatusCode(exception: unknown, code: string): number {
  const mapped = STATUS_BY_CODE[code];
  if (mapped) return mapped;
  if (exception instanceof HttpException) return exception.getStatus();
  return 500;
}

function getSafeMessage(exception: unknown, statusCode: number): string {
  if (statusCode >= 500) return 'Internal server error';
  if (exception instanceof Error) return exception.message;
  return 'Request failed';
}

function statusToCode(status: number): string {
  switch (status) {
    case 400: return 'BAD_REQUEST';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 409: return 'CONFLICT';
    case 429: return 'RATE_LIMIT_EXCEEDED';
    case 503: return 'SERVICE_UNAVAILABLE';
    default: return 'HTTP_ERROR';
  }
}
