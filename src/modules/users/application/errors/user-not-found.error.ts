export class UserNotFoundError extends Error {
  readonly code = 'USER_NOT_FOUND';

  constructor() {
    super('User not found');
    this.name = 'UserNotFoundError';
  }
}
