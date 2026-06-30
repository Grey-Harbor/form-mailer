import { createTransportFromConfig } from './config.js';
import { createFormMailerCore } from './mailer.js';
import { resolveConfig } from './validation.js';
export { loadConfigFromEnv } from './config.js';
export { createFormMailerError, isFormMailerError } from './errors.js';
export { createHttpTransport } from './http.js';
export { createSmtpTransport } from './smtp.js';
export function createFormMailer(config) {
    const resolved = resolveConfig(config);
    const transport = createTransportFromConfig(resolved);
    return createFormMailerCore({ ...resolved, transport });
}
//# sourceMappingURL=index.js.map