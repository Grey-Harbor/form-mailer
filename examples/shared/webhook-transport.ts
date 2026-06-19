import type { MailTransport, OutgoingMail, TransportSendResult } from '../../src/types.js';

export interface WebhookTransportConfig {
  endpoint: string;
  token?: string | undefined;
}

export function createWebhookTransport(config: WebhookTransportConfig): MailTransport {
  if (!config.endpoint) {
    throw new Error('A webhook endpoint is required.');
  }

  return {
    async send(message: OutgoingMail): Promise<TransportSendResult> {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(config.token ? { authorization: `Bearer ${config.token}` } : {}),
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Webhook transport failed with HTTP ${response.status}.`);
      }

      const payload = (await response.json().catch(() => undefined)) as
        | { messageId?: string | undefined }
        | undefined;

      return payload?.messageId ? { messageId: payload.messageId } : {};
    },
  };
}
