export class InvalidUserNameError extends Error {
  readonly code = 'INVALID_USER_NAME';

  constructor() {
    super('User name must not be empty');
    this.name = 'InvalidUserNameError';
  }
}
