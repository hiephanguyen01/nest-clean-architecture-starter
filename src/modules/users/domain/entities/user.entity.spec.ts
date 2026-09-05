import { describe, expect, it } from 'vitest';
import { InvalidUserNameError } from '../errors/invalid-user-name.error.js';
import { UserRole } from '../enums/user-role.enum.js';
import { UserStatus } from '../enums/user-status.enum.js';
import { Email } from '../value-objects/email.vo.js';
import { UserId } from '../value-objects/user-id.vo.js';
import { User } from './user.entity.js';

describe('User', () => {
  const now = new Date('2026-09-05T00:00:00.000Z');

  it('creates an active regular user with explicit persisted fields', () => {
    const user = User.create({
      id: UserId.create('9d4fa61e-d2cf-4c58-8dbd-dce4220df511'),
      email: Email.create('USER@example.com'),
      passwordHash: 'argon-hash',
      name: 'Alice',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      now,
    });

    expect(user.email.value).toBe('user@example.com');
    expect(user.name).toBe('Alice');
    expect(user.createdAt).toEqual(now);
    expect(user.updatedAt).toEqual(now);
  });

  it('rejects an empty name', () => {
    expect(() =>
      User.create({
        id: UserId.create('9d4fa61e-d2cf-4c58-8dbd-dce4220df511'),
        email: Email.create('user@example.com'),
        passwordHash: 'argon-hash',
        name: '   ',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        now,
      }),
    ).toThrow(InvalidUserNameError);
  });

  it('updates email only through a validated Email value object', () => {
    const user = User.create({
      id: UserId.create('9d4fa61e-d2cf-4c58-8dbd-dce4220df511'),
      email: Email.create('old@example.com'),
      passwordHash: 'argon-hash',
      name: 'Alice',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      now,
    });
    const changedAt = new Date('2026-09-05T01:00:00.000Z');

    user.changeEmail(Email.create('NEW@example.com'), changedAt);

    expect(user.email.value).toBe('new@example.com');
    expect(user.updatedAt).toEqual(changedAt);
  });

  it('rejects an empty name when renaming', () => {
    const user = User.create({
      id: UserId.create('9d4fa61e-d2cf-4c58-8dbd-dce4220df511'),
      email: Email.create('user@example.com'),
      passwordHash: 'argon-hash',
      name: 'Alice',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      now,
    });

    expect(() => user.rename(' ', new Date('2026-09-05T01:00:00.000Z'))).toThrow(
      InvalidUserNameError,
    );
  });
});
