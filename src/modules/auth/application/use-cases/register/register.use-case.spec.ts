import { describe, expect, it } from 'vitest';
import type { CreateUserUseCase } from '../../../../users/application/use-cases/create-user/create-user.use-case.js';
import { UserRole } from '../../../../users/domain/enums/user-role.enum.js';
import { UserStatus } from '../../../../users/domain/enums/user-status.enum.js';
import type { PasswordHasher } from '../../ports/password-hasher.js';
import { WeakPasswordError } from '../../errors/weak-password.error.js';
import { RegisterUseCase } from './register.use-case.js';

class FakePasswordHasher implements PasswordHasher {
  async hash(value: string): Promise<string> {
    return `hashed:${value}`;
  }
  async verify(_value: string, _hash: string): Promise<boolean> {
    return false;
  }
}

class CapturingCreateUser {
  input?: { email: string; passwordHash: string; name: string };
  async execute(input: { email: string; passwordHash: string; name: string }) {
    this.input = input;
    return {
      id: '9d4fa61e-d2cf-4c58-8dbd-dce4220df511',
      email: input.email.toLowerCase(),
      name: input.name,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt: new Date('2026-09-05T00:00:00.000Z'),
      updatedAt: new Date('2026-09-05T00:00:00.000Z'),
    };
  }
}

describe('RegisterUseCase', () => {
  it('hashes the password before passing data to Users and does not create a session', async () => {
    const createUser = new CapturingCreateUser();
    const useCase = new RegisterUseCase(
      new FakePasswordHasher(),
      createUser as unknown as CreateUserUseCase,
    );

    const user = await useCase.execute({
      email: 'USER@example.com',
      password: 'CorrectHorseBatteryStaple!',
      name: 'Alice',
    });

    expect(createUser.input?.passwordHash).toBe('hashed:CorrectHorseBatteryStaple!');
    expect(user.role).toBe(UserRole.USER);
  });

  it('rejects weak passwords at the application boundary', async () => {
    const createUser = new CapturingCreateUser();
    const useCase = new RegisterUseCase(
      new FakePasswordHasher(),
      createUser as unknown as CreateUserUseCase,
    );

    await expect(
      useCase.execute({ email: 'user@example.com', password: 'too-short', name: 'Alice' }),
    ).rejects.toBeInstanceOf(WeakPasswordError);
    expect(createUser.input).toBeUndefined();
  });
});
