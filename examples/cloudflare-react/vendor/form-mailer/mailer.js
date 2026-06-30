import { buildMailMessage } from './mail.js';
import { createFormMailerError, isFormMailerError } from './errors.js';
import { validateSubmission, validationFailureError } from './validation.js';
export function createFormMailerCore(config) {
    return {
        validate(submission) {
            return validateSubmission(submission, config);
        },
        async send(submission) {
            const validation = validateSubmission(submission, config);
            if (!validation.ok) {
                return {
                    ok: false,
                    error: validationFailureError(validation.issues),
                };
            }
            try {
                const message = buildMailMessage(submission, config);
                const result = await config.transport.send(message);
                return {
                    ok: true,
                    ...(result.messageId ? { messageId: result.messageId } : {}),
                    envelope: {
                        from: config.from.email,
                        to: message.to,
                    },
                };
            }
            catch (error) {
                return {
                    ok: false,
                    error: isFormMailerError(error)
                        ? error
                        : createFormMailerError('transport_error', error instanceof Error ? error.message : 'Form mail send failed.', {
                            cause: error instanceof Error ? error.message : String(error),
                        }),
                };
            }
        },
    };
}
//# sourceMappingURL=mailer.js.map