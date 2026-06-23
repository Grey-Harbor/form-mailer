import { createTransportFromConfig } from './config.js';
import { createFormMailerCore } from './mailer.js';
import { resolveConfig } from './validation.js';
import type { FormMailer, FormMailerConfig } from './types.js';

export { loadConfigFromEnv } from './config.js';
export { createFormMailerError, isFormMailerError } from './errors.js';
export { createHttpTransport } from './http.js';
export { createSmtpTransport } from './smtp.js';
export type {
  FormMailer,
  FormMailerConfig,
  FormMailerError,
  FormMailerErrorCode,
  FormMailSubmission,
  HttpTransportConfig,
  MailAddress,
  MailTransport,
  OutgoingMail,
  ResolvedFormMailerConfig,
  SendMailFailure,
  SendMailOutcome,
  SendMailResult,
  SmtpConnectionConfig,
  SubmissionFields,
  SubmissionValue,
  TransportSendResult,
  ValidationIssue,
  ValidationResult,
} from './types.js';

export function createFormMailer(config: FormMailerConfig): FormMailer {
  const resolved = resolveConfig(config);
  const transport = createTransportFromConfig(resolved);
  return createFormMailerCore({ ...resolved, transport });
}
