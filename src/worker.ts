import { createFormMailerError } from './errors.js';
import { createFormMailerCore } from './mailer.js';
import { createHttpTransport } from './http.js';
import { resolveConfig } from './validation.js';
import type {
  FormMailer,
  FormMailerConfig,
  FormMailSubmission,
  FormMailerError,
  FormMailerErrorCode,
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
} from './types.js';

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

  if (!config.http) {
    throw createFormMailerError(
      'config_error',
      'HTTP configuration is required when no transport is provided.',
    );
  }

  return createHttpTransport(config.http);
}

export function createFormMailer(config: FormMailerConfig): FormMailer {
  const resolved = resolveConfig(config);
  const transport = createTransportFromConfig(resolved);
  return createFormMailerCore({ ...resolved, transport });
}
