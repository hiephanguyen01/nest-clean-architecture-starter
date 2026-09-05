import { describe, expect, it } from 'vitest';
import type { User } from '../../../domain/entities/user.entity.js';
import type { Email } from '../../../domain/value-objects/email.vo.js';
import type { UserId } from '../../../domain/value-objects/user-id.vo.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserNotFoundError } from '../../errors/user-not-found.error.js';
import { GetUserUseCase } from './get-user.use-case.js';

class EmptyUserRepository extends UserRepository {
  async findById(_id: UserId): Promise<User | null> {
    return null;
  }
  async findByEmail(_email: Email): Promise<User | null> {
    return null;
  }
  async save(_user: User): Promise<void> {}
}

describe('GetUserUseCase', () => {
  it('throws a stable application error when the user does not exist', async () => {
    const useCase = new GetUserUseCase(new EmptyUserRepository());

    await expect(useCase.execute({ id: '9d4fa61e-d2cf-4c58-8dbd-dce4220df511' })).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
