import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createFormMailer } from '../src/index.js';
import type { MailTransport, OutgoingMail, SubmissionValue } from '../src/types.js';

function createMockTransport(handler: (message: OutgoingMail) => Promise<{ messageId?: string }> | { messageId?: string }): MailTransport {
  return {
    async send(message: OutgoingMail) {
      return handler(message);
    },
  };
}

test('sends a validated submission through the configured transport', async () => {
  let captured: OutgoingMail | undefined;
  const mailer = createFormMailer({
    from: 'sender@example.com',
    to: ['recipient@example.com'],
    transport: createMockTransport(async (message) => {
      captured = message;
      return { messageId: 'abc123' };
    }),
  });

  const result = await mailer.send({
    email: 'visitor@example.com',
    name: 'Ada Lovelace',
    message: 'Hello from the site',
    fields: { topic: 'support' },
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.messageId, 'abc123');
    assert.deepEqual(result.envelope, {
      from: 'sender@example.com',
      to: ['recipient@example.com'],
    });
  }
  assert.ok(captured);
  assert.equal(captured?.subject, 'Form submission from Ada Lovelace');
  assert.match(captured?.text ?? '', /Hello from the site/);
});

test('rejects invalid submissions before transport work begins', async () => {
  let called = false;
  const mailer = createFormMailer({
    from: 'sender@example.com',
    to: ['recipient@example.com'],
    transport: createMockTransport(async () => {
      called = true;
      return {};
    }),
  });

  const result = await mailer.send({
    email: 'not-an-email',
    fields: {},
  });

  assert.equal(result.ok, false);
  assert.equal(called, false);
  if (!result.ok) {
    assert.equal(result.error.code, 'validation_error');
  }
});

test('routes submissions through recipientMap when recipientKey is set', async () => {
  let captured: OutgoingMail | undefined;
  const mailer = createFormMailer({
    from: 'sender@example.com',
    to: ['default@example.com'],
    recipientMap: {
      support: 'support@example.com',
      sales: ['sales@example.com', 'ops@example.com'],
    },
    transport: createMockTransport(async (message) => {
      captured = message;
      return { messageId: 'route-123' };
    }),
  });

  const result = await mailer.send({
    email: 'visitor@example.com',
    recipientKey: 'sales',
    message: 'Route me',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(captured?.to, ['sales@example.com', 'ops@example.com']);
});

test('serializes nested and circular field values without rejecting send()', async () => {
  let captured: OutgoingMail | undefined;
  const mailer = createFormMailer({
    from: 'sender@example.com',
    to: ['recipient@example.com'],
    transport: createMockTransport(async (message) => {
      captured = message;
      return { messageId: 'nested-123' };
    }),
  });

  const nested: { [key: string]: SubmissionValue } = {
    topic: 'support',
    details: {
      priority: 'high',
    },
  };
  nested.self = nested;

  const result = await mailer.send({
    email: 'visitor@example.com',
    fields: {
      metadata: nested,
    },
  });

  assert.equal(result.ok, true);
  assert.match(captured?.text ?? '', /"\[Circular\]"/);
  assert.match(captured?.html ?? '', /&quot;\[Circular\]&quot;/);
});
