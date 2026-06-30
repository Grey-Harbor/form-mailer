import type { FormMailerConfig } from './types.js';
export declare function loadConfigFromEnv(env?: NodeJS.ProcessEnv): Promise<FormMailerConfig>;
export declare function createTransportFromConfig(config: FormMailerConfig): import("./types.js").MailTransport;
//# sourceMappingURL=config.d.ts.map