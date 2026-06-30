import type { FormMailerError, FormMailerErrorCode } from './types.js';
export declare function createFormMailerError(code: FormMailerErrorCode, message: string, details?: Record<string, unknown>): FormMailerError;
export declare function isFormMailerError(value: unknown): value is FormMailerError;
//# sourceMappingURL=errors.d.ts.map