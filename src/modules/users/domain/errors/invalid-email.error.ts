export class InvalidEmailError extends Error {
  readonly code = 'INVALID_EMAIL';

  constructor() {
    super('Email is invalid');
    this.name = 'InvalidEmailError';
  }
}
