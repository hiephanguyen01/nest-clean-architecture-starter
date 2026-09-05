import type { Clock } from '../../../../../shared/application/ports/clock.js';
import type { IdGenerator } from '../../../../../shared/application/ports/id-generator.js';
import { User } from '../../../domain/entities/user.entity.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import { Email } from '../../../domain/value-objects/email.vo.js';
import { UserId } from '../../../domain/value-objects/user-id.vo.js';
import type { UserOutput } from '../../contracts/user-output.js';
import { EmailAlreadyExistsError } from '../../errors/email-already-exists.error.js';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
}

export class CreateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    const email = Email.create(input.email);
    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyExistsError();
    }

    const user = User.create({
      id: UserId.create(this.ids.next()),
      email,
      passwordHash: input.passwordHash,
      name: input.name,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      now: this.clock.now(),
    });

    await this.users.save(user);
    return toUserOutput(user);
  }
}

export function toUserOutput(user: User): UserOutput {
  return {
    id: user.id.value,
    email: user.email.value,
    name: user.name,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
