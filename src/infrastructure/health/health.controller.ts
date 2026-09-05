import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../shared/presentation/security/security-metadata.js';
import { DatabaseHealthService } from '../database/database-health.service.js';

interface HealthResponse {
  status: 'ok';
}

interface ReadinessResponse extends HealthResponse {
  checks: { database: 'up' };
}

@ApiTags('health')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(@Inject(DatabaseHealthService) private readonly database: DatabaseHealthService) {}

  @Get()
  @ApiOkResponse({ schema: { example: { status: 'ok' } } })
  health(): HealthResponse {
    return { status: 'ok' };
  }

  @Get('live')
  @ApiOkResponse({ schema: { example: { status: 'ok' } } })
  live(): HealthResponse {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOkResponse({ schema: { example: { status: 'ok', checks: { database: 'up' } } } })
  @ApiServiceUnavailableResponse({ description: 'Database is not ready' })
  async ready(): Promise<ReadinessResponse> {
    if (!(await this.database.isReady())) {
      throw new ServiceUnavailableException('Database is not ready');
    }
    return { status: 'ok', checks: { database: 'up' } };
  }
}
