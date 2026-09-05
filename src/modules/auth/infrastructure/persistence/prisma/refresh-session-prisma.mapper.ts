import type { RefreshSession as PrismaRefreshSession } from '../../../../../generated/prisma/client.js';
import { RefreshSession } from '../../../domain/entities/refresh-session.entity.js';

export class RefreshSessionPrismaMapper {
  static toDomain(raw: PrismaRefreshSession): RefreshSession {
    return RefreshSession.rehydrate({
      id: raw.id,
      userId: raw.userId,
      tokenHash: raw.tokenHash,
      expiresAt: raw.expiresAt,
      createdAt: raw.createdAt,
      revokedAt: raw.revokedAt,
      replacedBySessionId: raw.replacedBySessionId,
    });
  }

  static toPersistence(session: RefreshSession) {
    return {
      id: session.id,
      userId: session.userId,
      tokenHash: session.tokenHash,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      replacedBySessionId: session.replacedBySessionId,
      createdAt: session.createdAt,
    };
  }
}
