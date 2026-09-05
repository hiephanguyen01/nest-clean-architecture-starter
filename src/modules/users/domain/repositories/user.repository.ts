import type { User } from '../entities/user.entity.js';
import type { Email } from '../value-objects/email.vo.js';
import type { UserId } from '../value-objects/user-id.vo.js';

export abstract class UserRepository {
  abstract findById(id: UserId): Promise<User | null>;
  abstract findByEmail(email: Email): Promise<User | null>;
  abstract save(user: User): Promise<void>;
}
