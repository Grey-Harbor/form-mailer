import { createTransportFromConfig } from './config.js';
import { buildMailMessage } from './mail.js';
import { createFormMailerError, isFormMailerError } from './errors.js';
import { validateSubmission, validationFailureError, resolveConfig } from './validation.js';
import type { FormMailer, FormMailerConfig, FormMailSubmission } from './types.js';

export { loadConfigFromEnv, loadConfigFromFile } from './config.js';
export { createFormMailerError, isFormMailerError } from './errors.js';
export { createSmtpTransport } from './smtp.js';
export type {
  FormMailer,
  FormMailerConfig,
  FormMailerError,
  FormMailerErrorCode,
  FormMailSubmission,
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

  return {
    validate(submission: FormMailSubmission) {
      return validateSubmission(submission, resolved);
    },

    async send(submission: FormMailSubmission) {
      const validation = validateSubmission(submission, resolved);
      if (!validation.ok) {
        return {
          ok: false as const,
          error: validationFailureError(validation.issues),
        };
      }

      try {
        const message = buildMailMessage(submission, resolved);
        const result = await transport.send(message);
        return {
          ok: true as const,
          ...(result.messageId ? { messageId: result.messageId } : {}),
          envelope: {
            from: resolved.from.email,
            to: message.to,
          },
        };
      } catch (error) {
        return {
          ok: false as const,
          error: isFormMailerError(error)
            ? error
            : createFormMailerError(
                'transport_error',
                error instanceof Error ? error.message : 'Form mail send failed.',
                {
                  cause: error instanceof Error ? error.message : String(error),
                },
              ),
        };
      }
    },
  };
}
