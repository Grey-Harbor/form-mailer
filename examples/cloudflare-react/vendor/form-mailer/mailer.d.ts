import type { FormMailer, MailTransport, ResolvedFormMailerConfig } from './types.js';
export interface FormMailerRuntimeConfig extends Omit<ResolvedFormMailerConfig, 'transport'> {
    transport: MailTransport;
}
export declare function createFormMailerCore(config: FormMailerRuntimeConfig): FormMailer;
//# sourceMappingURL=mailer.d.ts.map