export class AccountUnavailableError extends Error {
  readonly code = 'ACCOUNT_UNAVAILABLE';

  constructor() {
    super('User account is not active');
    this.name = 'AccountUnavailableError';
  }
}
