import type { FormMailer, FormMailerConfig } from './types.js';
export { loadConfigFromEnv } from './config.js';
export { createFormMailerError, isFormMailerError } from './errors.js';
export { createHttpTransport } from './http.js';
export { createSmtpTransport } from './smtp.js';
export type { FormMailer, FormMailerConfig, FormMailerError, FormMailerErrorCode, FormMailSubmission, HttpTransportConfig, HttpTransportRequest, MailAddress, MailTransport, OutgoingMail, ResolvedFormMailerConfig, SendMailFailure, SendMailOutcome, SendMailResult, SmtpConnectionConfig, SubmissionFields, SubmissionValue, TransportSendResult, ValidationIssue, ValidationResult, } from './types.js';
export declare function createFormMailer(config: FormMailerConfig): FormMailer;
//# sourceMappingURL=index.d.ts.map