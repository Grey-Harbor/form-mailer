import type { FormMailerConfig, FormMailerError, FormMailSubmission, MailAddress, ResolvedFormMailerConfig, ValidationIssue, ValidationResult } from './types.js';
export declare function isValidEmailAddress(value: string): boolean;
export declare function sanitizeHeaderValue(value: string): string;
export declare function formatAddress(address: MailAddress): string;
export declare function extractEmailAddress(value: string): string;
export declare function normalizeAddressList(value?: string | string[]): string[];
export declare function validateSubmission(submission: FormMailSubmission, config: Pick<FormMailerConfig, 'originAllowlist' | 'honeypotFieldName' | 'maxPayloadBytes' | 'requiredFields'>): ValidationResult;
export declare function resolveReplyTo(submission: FormMailSubmission, replyTo?: string | ((submission: FormMailSubmission) => string | undefined)): string | undefined;
export declare function resolveSubject(submission: FormMailSubmission, subject?: string | ((submission: FormMailSubmission) => string)): string;
export declare function resolveRecipients(submission: FormMailSubmission, config: Pick<FormMailerConfig, 'recipientMap' | 'to'>): string[];
export declare function resolveFromAddress(from: string | MailAddress | {
    email: string;
    name?: string | undefined;
}): MailAddress;
export declare function resolveConfig(config: FormMailerConfig): ResolvedFormMailerConfig;
export declare function validationFailureError(issues: ValidationIssue[]): FormMailerError;
//# sourceMappingURL=validation.d.ts.map