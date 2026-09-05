import { InvalidUserIdError } from '../errors/invalid-user-id.error.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class UserId {
  private constructor(readonly value: string) {}

  static create(value: string): UserId {
    const normalized = value.trim();
    if (!UUID_PATTERN.test(normalized)) {
      throw new InvalidUserIdError();
    }
    return new UserId(normalized.toLowerCase());
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
