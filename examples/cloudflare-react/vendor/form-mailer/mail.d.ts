import type { FormMailSubmission, OutgoingMail, ResolvedFormMailerConfig } from './types.js';
export declare function buildMailMessage(submission: FormMailSubmission, config: ResolvedFormMailerConfig): OutgoingMail;
export declare function renderMessageHeaders(message: OutgoingMail): string;
export declare function buildRawMessage(message: OutgoingMail): string;
//# sourceMappingURL=mail.d.ts.map