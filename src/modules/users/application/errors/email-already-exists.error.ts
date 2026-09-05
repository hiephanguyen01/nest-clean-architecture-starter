export class EmailAlreadyExistsError extends Error {
  readonly code = 'EMAIL_ALREADY_EXISTS';

  constructor() {
    super('A user with this email already exists');
    this.name = 'EmailAlreadyExistsError';
  }
}
