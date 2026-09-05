import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service.js';
import { EmailAlreadyExistsError } from '../../../application/errors/email-already-exists.error.js';
import type { User } from '../../../domain/entities/user.entity.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { Email } from '../../../domain/value-objects/email.vo.js';
import type { UserId } from '../../../domain/value-objects/user-id.vo.js';
import { UserPrismaMapper } from './user-prisma.mapper.js';

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: UserId): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { id: id.value } });
    return raw ? UserPrismaMapper.toDomain(raw) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { email: email.value } });
    return raw ? UserPrismaMapper.toDomain(raw) : null;
  }

  async save(user: User): Promise<void> {
    const data = UserPrismaMapper.toPersistence(user);
    try {
      await this.prisma.user.upsert({
        where: { id: user.id.value },
        create: data,
        update: data,
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new EmailAlreadyExistsError();
      }
      throw error;
    }
  }
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }
  return (error as { code?: unknown }).code === 'P2002';
}
