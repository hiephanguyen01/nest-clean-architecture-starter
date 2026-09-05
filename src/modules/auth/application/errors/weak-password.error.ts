export class WeakPasswordError extends Error {
  readonly code = 'WEAK_PASSWORD';

  constructor() {
    super('Password must be between 12 and 128 characters');
    this.name = 'WeakPasswordError';
  }
}
