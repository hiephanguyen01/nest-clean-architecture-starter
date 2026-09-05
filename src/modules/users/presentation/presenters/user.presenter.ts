import type { UserOutput } from '../../application/contracts/user-output.js';
import type { UserResponseDto } from '../dto/user-response.dto.js';

export class UserPresenter {
  static present(user: UserOutput): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
