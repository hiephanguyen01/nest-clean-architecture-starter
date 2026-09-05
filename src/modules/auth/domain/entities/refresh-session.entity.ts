export interface CreateRefreshSessionProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  now: Date;
}

export interface RehydrateRefreshSessionProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
  replacedBySessionId: string | null;
}

export class RefreshSession {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly tokenHash: string,
    readonly expiresAt: Date,
    readonly createdAt: Date,
    private _revokedAt: Date | null,
    private _replacedBySessionId: string | null,
  ) {}

  static create(props: CreateRefreshSessionProps): RefreshSession {
    return new RefreshSession(
      props.id,
      props.userId,
      props.tokenHash,
      new Date(props.expiresAt),
      new Date(props.now),
      null,
      null,
    );
  }

  static rehydrate(props: RehydrateRefreshSessionProps): RefreshSession {
    return new RefreshSession(
      props.id,
      props.userId,
      props.tokenHash,
      new Date(props.expiresAt),
      new Date(props.createdAt),
      props.revokedAt ? new Date(props.revokedAt) : null,
      props.replacedBySessionId,
    );
  }

  get revokedAt(): Date | null {
    return this._revokedAt ? new Date(this._revokedAt) : null;
  }

  get replacedBySessionId(): string | null {
    return this._replacedBySessionId;
  }

  isActive(now: Date): boolean {
    return this._revokedAt === null && this.expiresAt.getTime() > now.getTime();
  }

  revoke(at: Date, replacedBySessionId: string | null = null): void {
    if (this._revokedAt !== null) return;
    this._revokedAt = new Date(at);
    this._replacedBySessionId = replacedBySessionId;
  }
}
