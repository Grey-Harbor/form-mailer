import { buildMailMessage } from './mail.js';
import { createFormMailerError, isFormMailerError } from './errors.js';
import { validateSubmission, validationFailureError } from './validation.js';
import type {
  FormMailer,
  FormMailSubmission,
  MailTransport,
  ResolvedFormMailerConfig,
} from './types.js';

export interface FormMailerRuntimeConfig extends Omit<ResolvedFormMailerConfig, 'transport'> {
  transport: MailTransport;
}

export function createFormMailerCore(config: FormMailerRuntimeConfig): FormMailer {
  return {
    validate(submission: FormMailSubmission) {
      return validateSubmission(submission, config);
    },

    async send(submission: FormMailSubmission) {
      const validation = validateSubmission(submission, config);
      if (!validation.ok) {
        return {
          ok: false as const,
          error: validationFailureError(validation.issues),
        };
      }

      try {
        const message = buildMailMessage(submission, config);
        const result = await config.transport.send(message);
        return {
          ok: true as const,
          ...(result.messageId ? { messageId: result.messageId } : {}),
          envelope: {
            from: config.from.email,
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
