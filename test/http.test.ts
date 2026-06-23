import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createHttpTransport } from '../src/http.js';
import { isFormMailerError } from '../src/errors.js';

const MESSAGE = {
  from: 'sender@example.com',
  to: ['recipient@example.com'],
  subject: 'Hello',
  text: 'Body',
};

test('createHttpTransport returns a message id when the provider supplies one', async () => {
  const originalFetch = globalThis.fetch;
  let requestInit: RequestInit | undefined;
  globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
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

test('createHttpTransport rejects malformed URLs', async () => {
  assert.throws(
    () =>
      createHttpTransport({
        url: 'not-a-url',
      }),
    (error: unknown) => isFormMailerError(error) && error.code === 'config_error',
  );
});
