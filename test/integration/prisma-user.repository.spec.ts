import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import { EmailAlreadyExistsError } from '../../src/modules/users/application/errors/email-already-exists.error.js';
import { User } from '../../src/modules/users/domain/entities/user.entity.js';
import { UserRole } from '../../src/modules/users/domain/enums/user-role.enum.js';
import { UserStatus } from '../../src/modules/users/domain/enums/user-status.enum.js';
import { Email } from '../../src/modules/users/domain/value-objects/email.vo.js';
import { UserId } from '../../src/modules/users/domain/value-objects/user-id.vo.js';
import { PrismaUserRepository } from '../../src/modules/users/infrastructure/persistence/prisma/prisma-user.repository.js';
import { cleanDatabase, createTestPrisma } from '../helpers/test-prisma.js';

const prisma = createTestPrisma();
const repository = new PrismaUserRepository(prisma as unknown as PrismaService);

beforeEach(async () => cleanDatabase(prisma));
afterAll(async () => prisma.$disconnect());

describe('PrismaUserRepository', () => {
  it('round-trips a domain User without leaking Prisma types', async () => {
    const now = new Date('2026-09-05T00:00:00.000Z');
    const user = User.create({
      id: UserId.create(randomUUID()),
      email: Email.create('USER@example.com'),
      passwordHash: 'hash',
      name: 'Alice',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      now,
    });

    await repository.save(user);
    const loaded = await repository.findById(user.id);

    expect(loaded?.email.value).toBe('user@example.com');
    expect(loaded?.role).toBe(UserRole.ADMIN);
    expect(loaded?.status).toBe(UserStatus.ACTIVE);
  });

  it('lets the database unique constraint arbitrate concurrent duplicate email writes', async () => {
    const now = new Date('2026-09-05T00:00:00.000Z');
    const makeUser = () =>
      User.create({
        id: UserId.create(randomUUID()),
        email: Email.create('race@example.com'),
        passwordHash: 'hash',
        name: 'Race',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        now,
      });

    const results = await Promise.allSettled([repository.save(makeUser()), repository.save(makeUser())]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejection = results.find((result) => result.status === 'rejected');
    expect(rejection).toMatchObject({ status: 'rejected', reason: expect.any(EmailAlreadyExistsError) });
  });
});
