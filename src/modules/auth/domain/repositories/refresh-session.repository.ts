import type { RefreshSession } from '../entities/refresh-session.entity.js';

export interface RotateRefreshSessionInput {
  currentSessionId: string;
  userId: string;
  expectedTokenHash: string;
  replacement: RefreshSession;
  now: Date;
}

export abstract class RefreshSessionRepository {
  abstract create(session: RefreshSession): Promise<void>;
  abstract findById(id: string): Promise<RefreshSession | null>;
  abstract rotate(input: RotateRefreshSessionInput): Promise<boolean>;
  abstract revoke(id: string, userId: string, revokedAt: Date): Promise<boolean>;
}
