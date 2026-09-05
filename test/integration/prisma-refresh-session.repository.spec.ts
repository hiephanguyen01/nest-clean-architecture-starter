import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import { RefreshSession } from '../../src/modules/auth/domain/entities/refresh-session.entity.js';
import { PrismaRefreshSessionRepository } from '../../src/modules/auth/infrastructure/persistence/prisma/prisma-refresh-session.repository.js';
import { cleanDatabase, createTestPrisma } from '../helpers/test-prisma.js';

const prisma = createTestPrisma();
const repository = new PrismaRefreshSessionRepository(prisma as unknown as PrismaService);

beforeEach(async () => {
  await cleanDatabase(prisma);
  await prisma.user.create({
    data: {
      id: '9d4fa61e-d2cf-4c58-8dbd-dce4220df511',
      email: 'user@example.com',
      passwordHash: 'hash',
      name: 'Alice',
    },
  });
});
afterAll(async () => prisma.$disconnect());

describe('PrismaRefreshSessionRepository', () => {
  it('allows only one concurrent rotation of the same active session', async () => {
    const now = new Date('2026-09-05T00:00:00.000Z');
    const current = RefreshSession.create({
      id: randomUUID(),
      userId: '9d4fa61e-d2cf-4c58-8dbd-dce4220df511',
      tokenHash: 'current-hash',
      expiresAt: new Date('2026-09-12T00:00:00.000Z'),
      now,
    });
    await repository.create(current);

    const replacement = () =>
      RefreshSession.create({
        id: randomUUID(),
        userId: current.userId,
        tokenHash: randomUUID(),
        expiresAt: new Date('2026-09-12T00:00:00.000Z'),
        now,
      });

    const [first, second] = await Promise.all([
      repository.rotate({
        currentSessionId: current.id,
        userId: current.userId,
        expectedTokenHash: current.tokenHash,
        replacement: replacement(),
        now,
      }),
      repository.rotate({
        currentSessionId: current.id,
        userId: current.userId,
        expectedTokenHash: current.tokenHash,
        replacement: replacement(),
        now,
      }),
    ]);

    expect([first, second].filter(Boolean)).toHaveLength(1);
  });
});
