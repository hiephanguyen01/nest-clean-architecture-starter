import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import { Email } from '../../../domain/value-objects/email.vo.js';
import type { UserAuthenticationData } from '../../contracts/user-output.js';
import { UserNotFoundError } from '../../errors/user-not-found.error.js';
import { toUserOutput } from '../create-user/create-user.use-case.js';

export interface GetUserAuthenticationDataInput {
  email: string;
}

export class GetUserAuthenticationDataUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: GetUserAuthenticationDataInput): Promise<UserAuthenticationData> {
    const user = await this.users.findByEmail(Email.create(input.email));
    if (!user) {
      throw new UserNotFoundError();
    }
    return { ...toUserOutput(user), passwordHash: user.passwordHash };
  }
}
