export class InvalidRefreshTokenError extends Error {
  readonly code = 'INVALID_REFRESH_TOKEN';

  constructor() {
    super('Refresh token is invalid or no longer active');
    this.name = 'InvalidRefreshTokenError';
  }
}
