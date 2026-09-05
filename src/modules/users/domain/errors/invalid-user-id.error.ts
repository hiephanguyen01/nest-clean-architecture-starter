export class InvalidUserIdError extends Error {
  readonly code = 'INVALID_USER_ID';

  constructor() {
    super('User id is invalid');
    this.name = 'InvalidUserIdError';
  }
}
