import type { UserOutput } from '../../../../users/application/contracts/user-output.js';
import type { CreateUserUseCase } from '../../../../users/application/use-cases/create-user/create-user.use-case.js';
import { WeakPasswordError } from '../../errors/weak-password.error.js';
import type { PasswordHasher } from '../../ports/password-hasher.js';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export class RegisterUseCase {
  constructor(
    private readonly passwordHasher: PasswordHasher,
    private readonly createUser: CreateUserUseCase,
  ) {}

  async execute(input: RegisterInput): Promise<UserOutput> {
    if (input.password.length < 12 || input.password.length > 128) {
      throw new WeakPasswordError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    return this.createUser.execute({
      email: input.email,
      passwordHash,
      name: input.name,
    });
  }
}
