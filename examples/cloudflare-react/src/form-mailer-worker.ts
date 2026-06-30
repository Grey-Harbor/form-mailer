import { createFormMailerError } from '../vendor/form-mailer/errors.js';
import { createHttpTransport } from '../vendor/form-mailer/http.js';
import { createFormMailerCore } from '../vendor/form-mailer/mailer.js';
import { resolveConfig } from '../vendor/form-mailer/validation.js';
import type {
  FormMailer,
  FormMailerConfig,
  FormMailerError,
  FormMailerErrorCode,
  FormMailSubmission,
  HttpTransportConfig,
  HttpTransportRequest,
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
} from '../vendor/form-mailer/types.js';

export { createHttpTransport };
export type {
  FormMailer,
  FormMailerConfig,
  FormMailerError,
  FormMailerErrorCode,
  FormMailSubmission,
  HttpTransportConfig,
  HttpTransportRequest,
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
};

function createTransportFromConfig(config: ResolvedFormMailerConfig) {
  if (config.transport) {
    return config.transport;
  }

  if (config.http) {
    return createHttpTransport(config.http);
  }

  if (config.smtp) {
    throw createFormMailerError(
      'config_error',
      'SMTP configuration is not supported by the worker export. Use HTTP config instead.',
    );
  }

  throw createFormMailerError(
    'config_error',
    'HTTP configuration is required when no transport is provided.',
  );
}

export function createFormMailer(config: FormMailerConfig): FormMailer {
  const resolved = resolveConfig(config);
  const transport = createTransportFromConfig(resolved);
  return createFormMailerCore({ ...resolved, transport });
}
