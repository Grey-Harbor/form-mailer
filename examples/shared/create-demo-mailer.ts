import { createFormMailerCore } from '../../src/mailer.js';
import { resolveConfig } from '../../src/validation.js';
import type { FormMailer } from '../../src/types.js';
import { createDemoHttpTransport } from './http-transport.js';

export interface DemoMailerOptions {
  from: string;
  to: string | string[];
  endpoint: string;
  token?: string | undefined;
}

export function createDemoMailer(options: DemoMailerOptions): FormMailer {
  const transport = createDemoHttpTransport(options.endpoint, options.token);

  const resolved = resolveConfig({
    from: options.from,
    to: options.to,
    transport,
  });

  return createFormMailerCore({ ...resolved, transport });
}
