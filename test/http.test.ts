import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createHttpTransport } from '../src/http.js';
import { isFormMailerError } from '../src/errors.js';
import type { HttpTransportRequest } from '../src/types.js';

const MESSAGE = {
  from: 'sender@example.com',
  to: ['recipient@example.com'],
  subject: 'Hello',
  text: 'Body',
};

test('createHttpTransport returns a message id when the provider supplies one', async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl: string | URL | Request | undefined;
  let requestInit: RequestInit | undefined;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    requestUrl = input;
    requestInit = init;
    return new Response(JSON.stringify({ messageId: 'provider-id' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const transport = createHttpTransport({
      url: 'https://api.example.com/send',
      token: 'api-token',
      headers: { 'x-provider': 'demo', 'content-type': 'text/plain' },
    });

    const result = await transport.send(MESSAGE);
    const headers = new Headers(requestInit?.headers);

    assert.equal(result.messageId, 'provider-id');
    assert.equal(String(requestUrl), 'https://api.example.com/send');
    assert.equal(requestInit?.method, 'POST');
    assert.equal(headers.get('authorization'), 'Bearer api-token');
    assert.equal(headers.get('x-provider'), 'demo');
    assert.equal(headers.get('content-type'), 'application/json');
    assert.equal(requestInit?.body, JSON.stringify(MESSAGE));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('createHttpTransport returns an empty result when the provider omits messageId', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;

  try {
    const transport = createHttpTransport({
      url: 'https://api.example.com/send',
    });

    const result = await transport.send(MESSAGE);
    assert.deepEqual(result, {});
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('createHttpTransport applies request mapping for provider-specific payloads', async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl: string | URL | Request | undefined;
  let requestInit: RequestInit | undefined;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    requestUrl = input;
    requestInit = init;
    return new Response(JSON.stringify({ accepted: true }), {
      status: 202,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const transport = createHttpTransport({
      url: 'https://api.example.com/send',
      token: 'api-token',
      headers: { 'x-app': 'form-mailer', 'content-type': 'application/json' },
      mapRequest(message) {
        return {
          url: 'https://provider.example.com/messages',
          method: 'PUT',
          headers: {
            'content-type': 'application/vnd.provider+json',
            'x-app': 'provider-specific',
            'x-provider': 'smtp2go',
          },
          body: JSON.stringify({
            sender: message.from,
            recipients: message.to,
            subject: message.subject,
            body: { text: message.text },
          }),
        };
      },
    });

    const result = await transport.send(MESSAGE);
    const headers = new Headers(requestInit?.headers);

    assert.deepEqual(result, {});
    assert.equal(String(requestUrl), 'https://provider.example.com/messages');
    assert.equal(requestInit?.method, 'PUT');
    assert.equal(headers.get('authorization'), 'Bearer api-token');
    assert.equal(headers.get('x-app'), 'provider-specific');
    assert.equal(headers.get('x-provider'), 'smtp2go');
    assert.equal(headers.get('content-type'), 'application/vnd.provider+json');
    assert.equal(
      requestInit?.body,
      JSON.stringify({
        sender: MESSAGE.from,
        recipients: MESSAGE.to,
        subject: MESSAGE.subject,
        body: { text: MESSAGE.text },
      }),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('createHttpTransport uses a custom response parser when provided', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ data: { id: 'provider-id' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;

  try {
    const transport = createHttpTransport({
      url: 'https://api.example.com/send',
      parseResponse: async (response) => {
        const payload = (await response.json()) as { data?: { id?: string } };
        return payload.data?.id ? { messageId: payload.data.id } : {};
      },
    });

    const result = await transport.send(MESSAGE);
    assert.deepEqual(result, { messageId: 'provider-id' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('createHttpTransport allows a custom response parser to return an empty result', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;

  try {
    const transport = createHttpTransport({
      url: 'https://api.example.com/send',
      parseResponse: () => ({}),
    });

    const result = await transport.send(MESSAGE);
    assert.deepEqual(result, {});
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('createHttpTransport surfaces non-2xx failures as transport errors', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ error: 'denied' }), {
      status: 403,
      statusText: 'Forbidden',
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;

  try {
    const transport = createHttpTransport({
      url: 'https://api.example.com/send',
    });

    await assert.rejects(
      () => transport.send(MESSAGE),
      (error: unknown) =>
        isFormMailerError(error) &&
        error.code === 'transport_error' &&
        error.details?.status === 403 &&
        typeof error.details?.body === 'object',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('createHttpTransport keeps non-2xx failures as transport errors when hooks are configured', async () => {
  const originalFetch = globalThis.fetch;
  let parseCalled = false;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ error: 'denied' }), {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;

  try {
    const transport = createHttpTransport({
      url: 'https://api.example.com/send',
      mapRequest: () => ({
        body: JSON.stringify({ provider: true }),
      }),
      parseResponse: async () => {
        parseCalled = true;
        return {};
      },
    });

    await assert.rejects(
      () => transport.send(MESSAGE),
      (error: unknown) =>
        isFormMailerError(error) &&
        error.code === 'transport_error' &&
        error.details?.status === 422 &&
        typeof error.details?.body === 'object',
    );
    assert.equal(parseCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('createHttpTransport rejects invalid request mapper results', async () => {
  const transport = createHttpTransport({
    url: 'https://api.example.com/send',
    mapRequest: () => null as unknown as HttpTransportRequest,
  });

  await assert.rejects(
    () => transport.send(MESSAGE),
    (error: unknown) =>
      isFormMailerError(error) &&
      error.code === 'transport_error' &&
      error.message.includes('request mapper'),
  );
});

test('createHttpTransport rejects invalid mapped URLs', async () => {
  const transport = createHttpTransport({
    url: 'https://api.example.com/send',
    mapRequest: () => ({
      url: 'not-a-url',
    }),
  });

  await assert.rejects(
    () => transport.send(MESSAGE),
    (error: unknown) =>
      isFormMailerError(error) &&
      error.code === 'transport_error' &&
      error.message.includes('invalid absolute URL'),
  );
});

test('createHttpTransport rejects malformed URLs', async () => {
  assert.throws(
    () =>
      createHttpTransport({
        url: 'not-a-url',
      }),
    (error: unknown) => isFormMailerError(error) && error.code === 'config_error',
  );
});
