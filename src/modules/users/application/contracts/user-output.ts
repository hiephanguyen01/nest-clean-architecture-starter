import type { UserRole } from '../../domain/enums/user-role.enum.js';
import type { UserStatus } from '../../domain/enums/user-status.enum.js';

export interface UserOutput {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAuthenticationData extends UserOutput {
  passwordHash: string;
}
