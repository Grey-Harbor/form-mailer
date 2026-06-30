import * as net from 'node:net';
import * as tls from 'node:tls';
import type { MailTransport, SmtpConnectionConfig } from './types.js';
export interface SmtpTransportHooks {
    connect?: (config: SmtpConnectionConfig) => Promise<net.Socket | tls.TLSSocket>;
    upgradeToTls?: (socket: net.Socket, config: SmtpConnectionConfig) => Promise<tls.TLSSocket>;
    messageIdFactory?: () => string;
}
export declare function createSmtpTransport(config: SmtpConnectionConfig, hooks?: SmtpTransportHooks): MailTransport;
//# sourceMappingURL=smtp.d.ts.map