import {
  UserRole as PrismaUserRole,
  UserStatus as PrismaUserStatus,
  type User as PrismaUser,
} from '../../../../../generated/prisma/client.js';
import { User } from '../../../domain/entities/user.entity.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import { Email } from '../../../domain/value-objects/email.vo.js';
import { UserId } from '../../../domain/value-objects/user-id.vo.js';

export class UserPrismaMapper {
  static toDomain(raw: PrismaUser): User {
    return User.rehydrate({
      id: UserId.create(raw.id),
      email: Email.create(raw.email),
      passwordHash: raw.passwordHash,
      name: raw.name,
      role: UserPrismaMapper.toDomainRole(raw.role),
      status: UserPrismaMapper.toDomainStatus(raw.status),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(user: User) {
    return {
      id: user.id.value,
      email: user.email.value,
      passwordHash: user.passwordHash,
      name: user.name,
      role: UserPrismaMapper.toPrismaRole(user.role),
      status: UserPrismaMapper.toPrismaStatus(user.status),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private static toDomainRole(role: PrismaUserRole): UserRole {
    switch (role) {
      case PrismaUserRole.ADMIN:
        return UserRole.ADMIN;
      case PrismaUserRole.USER:
        return UserRole.USER;
      default:
        throw new Error(`Unsupported Prisma user role: ${String(role)}`);
    }
  }

  private static toPrismaRole(role: UserRole): PrismaUserRole {
    switch (role) {
      case UserRole.ADMIN:
        return PrismaUserRole.ADMIN;
      case UserRole.USER:
        return PrismaUserRole.USER;
      default:
        throw new Error(`Unsupported domain user role: ${String(role)}`);
    }
  }

  private static toDomainStatus(status: PrismaUserStatus): UserStatus {
    switch (status) {
      case PrismaUserStatus.ACTIVE:
        return UserStatus.ACTIVE;
      case PrismaUserStatus.INACTIVE:
        return UserStatus.INACTIVE;
      case PrismaUserStatus.BLOCKED:
        return UserStatus.BLOCKED;
      default:
        throw new Error(`Unsupported Prisma user status: ${String(status)}`);
    }
  }

  private static toPrismaStatus(status: UserStatus): PrismaUserStatus {
    switch (status) {
      case UserStatus.ACTIVE:
        return PrismaUserStatus.ACTIVE;
      case UserStatus.INACTIVE:
        return PrismaUserStatus.INACTIVE;
      case UserStatus.BLOCKED:
        return PrismaUserStatus.BLOCKED;
      default:
        throw new Error(`Unsupported domain user status: ${String(status)}`);
    }
  }
}
