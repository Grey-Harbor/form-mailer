export * from './config.js';
export * from './errors.js';
export * from './mail.js';
export * from './smtp.js';
export * from './types.js';
export * from './validation.js';

import { createTransportFromConfig } from './config.js';
import { buildMailMessage } from './mail.js';
import { createFormMailerError, isFormMailerError } from './errors.js';
import { validateSubmission, validationFailureError, resolveConfig } from './validation.js';
import type { FormMailer, FormMailerConfig, FormMailSubmission } from './types.js';

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
          messageId: result.messageId,
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
