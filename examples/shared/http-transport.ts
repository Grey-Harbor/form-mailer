import { createHttpTransport } from '../../src/http.js';

export function createDemoHttpTransport(endpoint: string, token?: string) {
  return createHttpTransport({
    url: endpoint,
    ...(token ? { token } : {}),
  });
}

export function createMappedDemoHttpTransport(endpoint: string, token?: string) {
  return createHttpTransport({
    url: endpoint,
    ...(token ? { token } : {}),
    mapRequest(message) {
      return {
        headers: {
          'content-type': 'application/vnd.demo+json',
        },
        body: JSON.stringify({
          sender: message.from,
          recipients: message.to,
          subject: message.subject,
          text: message.text,
          html: message.html,
          replyTo: message.replyTo,
        }),
      };
    },
    async parseResponse(response) {
      const payload = (await response.json().catch(() => undefined)) as { data?: { id?: string } } | undefined;
      return payload?.data?.id ? { messageId: payload.data.id } : {};
    },
  });
}
