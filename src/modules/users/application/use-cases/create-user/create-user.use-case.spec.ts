import { describe, expect, it } from 'vitest';
import type { Clock } from '../../../../../shared/application/ports/clock.js';
import type { IdGenerator } from '../../../../../shared/application/ports/id-generator.js';
import { EmailAlreadyExistsError } from '../../errors/email-already-exists.error.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import type { User } from '../../../domain/entities/user.entity.js';
import type { Email } from '../../../domain/value-objects/email.vo.js';
import type { UserId } from '../../../domain/value-objects/user-id.vo.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { CreateUserUseCase } from './create-user.use-case.js';

class InMemoryUserRepository extends UserRepository {
  readonly items: User[] = [];

  async findById(id: UserId): Promise<User | null> {
    return this.items.find((user) => user.id.equals(id)) ?? null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    return this.items.find((user) => user.email.equals(email)) ?? null;
  }

  async save(user: User): Promise<void> {
    this.items.push(user);
  }
}

class FixedClock implements Clock {
  constructor(private readonly value: Date) {}
  now(): Date {
    return this.value;
  }
}

class FixedIdGenerator implements IdGenerator {
  constructor(private readonly value: string) {}
  next(): string {
    return this.value;
  }
}

describe('CreateUserUseCase', () => {
  const now = new Date('2026-09-05T00:00:00.000Z');

  it('creates a USER/ACTIVE user and never accepts role/status from input', async () => {
    const repository = new InMemoryUserRepository();
    const useCase = new CreateUserUseCase(
      repository,
      new FixedClock(now),
      new FixedIdGenerator('9d4fa61e-d2cf-4c58-8dbd-dce4220df511'),
    );

    const output = await useCase.execute({
      email: ' USER@example.com ',
      passwordHash: 'argon-hash',
      name: 'Alice',
    });

    expect(output).toEqual({
      id: '9d4fa61e-d2cf-4c58-8dbd-dce4220df511',
      email: 'user@example.com',
      name: 'Alice',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });
    expect(repository.items).toHaveLength(1);
  });

  it('rejects an existing canonical email', async () => {
    const repository = new InMemoryUserRepository();
    const useCase = new CreateUserUseCase(
      repository,
      new FixedClock(now),
      new FixedIdGenerator('9d4fa61e-d2cf-4c58-8dbd-dce4220df511'),
    );
    await useCase.execute({ email: 'user@example.com', passwordHash: 'hash-1', name: 'Alice' });

    await expect(
      useCase.execute({ email: 'USER@example.com', passwordHash: 'hash-2', name: 'Bob' }),
    ).rejects.toThrow(EmailAlreadyExistsError);
  });
});
