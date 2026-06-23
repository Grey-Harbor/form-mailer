import { createFormMailerError } from './errors.js';
import type { HttpTransportConfig, MailTransport, OutgoingMail, TransportSendResult } from './types.js';

function ensureValidUrl(value: string): string {
  try {
    return new URL(value).toString();
  } catch {
    throw createFormMailerError('config_error', 'HTTP transport URL must be a valid absolute URL.');
  }
}

function buildHeaders(config: HttpTransportConfig): Headers {
  const headers = new Headers({
    'content-type': 'application/json',
    ...(config.token ? { authorization: `Bearer ${config.token}` } : {}),
  });

  for (const [name, value] of Object.entries(config.headers ?? {})) {
    headers.set(name, value);
  }

  const contentType = headers.get('content-type');
  if (!contentType || !contentType.toLowerCase().includes('application/json')) {
    headers.set('content-type', 'application/json');
  }

  return headers;
}

async function readSafeErrorBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  try {
    const body = await response.text();
    const trimmed = body.trim();
    return trimmed ? trimmed.slice(0, 500) : undefined;
  } catch {
    return undefined;
  }
}

async function readMessageId(response: Response): Promise<string | undefined> {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('application/json')) {
    return undefined;
  }

  const payload = (await response.json().catch(() => undefined)) as { messageId?: unknown } | undefined;
  return typeof payload?.messageId === 'string' ? payload.messageId : undefined;
}

export function createHttpTransport(config: HttpTransportConfig): MailTransport {
  const url = ensureValidUrl(config.url);

  return {
    async send(message: OutgoingMail): Promise<TransportSendResult> {
      const response = await fetch(url, {
        method: 'POST',
        headers: buildHeaders(config),
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const body = await readSafeErrorBody(response);
        throw createFormMailerError('transport_error', `HTTP transport failed with HTTP ${response.status}.`, {
          status: response.status,
          statusText: response.statusText,
          ...(body !== undefined ? { body } : {}),
        });
      }

      const messageId = await readMessageId(response);
      return messageId ? { messageId } : {};
    },
  };
}
