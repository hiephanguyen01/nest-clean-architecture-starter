export interface ValidationErrorDetail {
  field: string;
  messages: string[];
}

export class ValidationFailureError extends Error {
  readonly code = 'VALIDATION_ERROR';

  constructor(readonly errors: ValidationErrorDetail[]) {
    super('Validation failed');
    this.name = 'ValidationFailureError';
  }
}
