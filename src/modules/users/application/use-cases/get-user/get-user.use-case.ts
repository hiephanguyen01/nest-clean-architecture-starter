import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserId } from '../../../domain/value-objects/user-id.vo.js';
import type { UserOutput } from '../../contracts/user-output.js';
import { UserNotFoundError } from '../../errors/user-not-found.error.js';
import { toUserOutput } from '../create-user/create-user.use-case.js';

export interface GetUserInput {
  id: string;
}

export class GetUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: GetUserInput): Promise<UserOutput> {
    const user = await this.users.findById(UserId.create(input.id));
    if (!user) {
      throw new UserNotFoundError();
    }
    return toUserOutput(user);
  }
}
