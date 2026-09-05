import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { DatabaseHealthService } from '../database/database-health.service.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('reports database readiness when PostgreSQL is reachable', async () => {
    const database = { isReady: async () => true } as DatabaseHealthService;
    const controller = new HealthController(database);

    await expect(controller.ready()).resolves.toEqual({
      status: 'ok',
      checks: { database: 'up' },
    });
  });

  it('fails readiness when PostgreSQL is unavailable', async () => {
    const database = { isReady: async () => false } as DatabaseHealthService;
    const controller = new HealthController(database);

    try {
      await controller.ready();
      expect.unreachable('ready() should throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getStatus()).toBe(503);
    }
  });
});
