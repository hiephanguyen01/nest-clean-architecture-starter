import { InvalidEmailError } from '../errors/invalid-email.error.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(readonly value: string) {}

  static create(value: string): Email {
    const normalized = value.trim().toLowerCase();
    if (normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) {
      throw new InvalidEmailError();
    }
    return new Email(normalized);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
