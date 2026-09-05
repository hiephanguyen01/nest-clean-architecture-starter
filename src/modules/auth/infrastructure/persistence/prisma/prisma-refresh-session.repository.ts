import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service.js';
import type { RefreshSession } from '../../../domain/entities/refresh-session.entity.js';
import {
  RefreshSessionRepository,
  type RotateRefreshSessionInput,
} from '../../../domain/repositories/refresh-session.repository.js';
import { RefreshSessionPrismaMapper } from './refresh-session-prisma.mapper.js';

@Injectable()
export class PrismaRefreshSessionRepository extends RefreshSessionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async create(session: RefreshSession): Promise<void> {
    await this.prisma.refreshSession.create({
      data: RefreshSessionPrismaMapper.toPersistence(session),
    });
  }

  async findById(id: string): Promise<RefreshSession | null> {
    const raw = await this.prisma.refreshSession.findUnique({ where: { id } });
    return raw ? RefreshSessionPrismaMapper.toDomain(raw) : null;
  }

  async rotate(input: RotateRefreshSessionInput): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.refreshSession.updateMany({
        where: {
          id: input.currentSessionId,
          userId: input.userId,
          tokenHash: input.expectedTokenHash,
          revokedAt: null,
          expiresAt: { gt: input.now },
        },
        data: {
          revokedAt: input.now,
          replacedBySessionId: input.replacement.id,
        },
      });
      if (updated.count !== 1) return false;

      await tx.refreshSession.create({
        data: RefreshSessionPrismaMapper.toPersistence(input.replacement),
      });
      return true;
    });
  }

  async revoke(id: string, userId: string, revokedAt: Date): Promise<boolean> {
    const result = await this.prisma.refreshSession.updateMany({
      where: {
        id,
        userId,
        revokedAt: null,
        expiresAt: { gt: revokedAt },
      },
      data: { revokedAt },
    });
    return result.count === 1;
  }
}
