import type { FormMailerError, FormMailerErrorCode } from './types.js';

export function createFormMailerError(
  code: FormMailerErrorCode,
  message: string,
  details?: Record<string, unknown>,
): FormMailerError {
  const error = new Error(message) as FormMailerError;
  error.code = code;
  if (details && Object.keys(details).length > 0) {
    error.details = details;
  }
  return error;
}

export function isFormMailerError(value: unknown): value is FormMailerError {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'code' in value &&
      typeof (value as { code?: unknown }).code === 'string',
  );
}
