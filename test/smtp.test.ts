import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createSmtpTransport } from '../src/smtp.js';
import type { SmtpConnectionConfig } from '../src/types.js';

class ScriptedSocket extends EventEmitter {
  public writes: string[] = [];
  public ended = false;
  public destroyed = false;

  constructor(private readonly responses: string[][] = []) {
    super();
  }

  setEncoding(): void {}

  start(): void {
    this.flushNext();
  }

  write(chunk: string): boolean {
    this.writes.push(chunk);
    this.flushNext();
    return true;
  }

  end(): void {
    this.ended = true;
    this.emit('close');
  }

  destroy(): void {
    this.destroyed = true;
    this.emit('close');
  }

  private flushNext(): void {
    const response = this.responses.shift();
    if (!response) {
      return;
    }
    this.emit('data', `${response.join('\r\n')}\r\n`);
  }
}

class ThrowingDestroySocket extends ScriptedSocket {
  override destroy(): void {
    super.destroy();
    throw new Error('Cannot call releaseLock() on a reader with outstanding read promises.');
  }
}

function makeTransport(
  config: SmtpConnectionConfig,
  hooks: {
    connect: ScriptedSocket;
    upgrade?: ScriptedSocket;
  },
) {
  return createSmtpTransport(config, {
    connect: async () => {
      setImmediate(() => hooks.connect.start());
      return hooks.connect as never;
    },
    upgradeToTls: async () => {
      const socket = hooks.upgrade ?? hooks.connect;
      setImmediate(() => socket.start());
      return socket as never;
    },
    messageIdFactory: () => '<fixed-message-id@example.com>',
  });
}

test('sends a message through SMTP with STARTTLS and auth', async () => {
  const plain = new ScriptedSocket([
    ['220 mail.example.com ESMTP ready'],
    ['250 mail.example.com greets you'],
    ['220 Ready to start TLS'],
  ]);
  const secure = new ScriptedSocket([
    ['250 mail.example.com greets you again'],
    ['334 VXNlcm5hbWU6'],
    ['334 UGFzc3dvcmQ6'],
    ['235 Authentication successful'],
    ['250 2.1.0 Ok'],
    ['250 2.1.5 Ok'],
    ['354 End data with <CR><LF>.<CR><LF>'],
    ['250 2.0.0 Message accepted'],
    ['221 2.0.0 Bye'],
  ]);

  const transport = makeTransport(
    {
      host: 'mail.example.com',
      starttls: true,
      username: 'user@example.com',
      password: 'secret',
      tls: {
        servername: 'mail.example.com',
      },
    },
    { connect: plain, upgrade: secure },
  );

  const result = await transport.send({
    from: 'sender@example.com',
    to: ['recipient@example.com'],
    subject: 'Hello',
    text: 'Line 1',
  });

  assert.equal(result.messageId, '<fixed-message-id@example.com>');
  assert.deepEqual(plain.writes.slice(0, 2), ['EHLO mail.example.com\r\n', 'STARTTLS\r\n']);
  assert.ok(secure.writes.includes('AUTH LOGIN\r\n'));
  assert.ok(secure.writes.some((entry) => entry.startsWith('MAIL FROM:<sender@example.com>')));
  assert.ok(secure.ended);
});

test('cleans up after an SMTP rejection', async () => {
  const socket = new ScriptedSocket([
    ['220 mail.example.com ESMTP ready'],
    ['250 mail.example.com greets you'],
    ['250 OK'],
    ['550 mailbox unavailable'],
    ['250 RSET ok'],
  ]);

  const transport = makeTransport(
    {
      host: 'mail.example.com',
    },
    { connect: socket },
  );

  await assert.rejects(
    () =>
      transport.send({
        from: 'sender@example.com',
        to: ['recipient@example.com'],
        subject: 'Hello',
        text: 'Line 1',
      }),
    (error: unknown) => Boolean(error && typeof error === 'object' && 'code' in error),
  );

  assert.ok(socket.writes.some((entry) => entry.startsWith('RCPT TO:<recipient@example.com>')));
  assert.ok(socket.writes.includes('RSET\r\n'));
  assert.equal(socket.destroyed, true);
});

test('preserves the SMTP rejection when teardown throws', async () => {
  const socket = new ThrowingDestroySocket([
    ['220 mail.example.com ESMTP ready'],
    ['250 mail.example.com greets you'],
    ['250 OK'],
    ['550 mailbox unavailable'],
    ['250 RSET ok'],
  ]);

  const transport = makeTransport(
    {
      host: 'mail.example.com',
    },
    { connect: socket },
  );

  await assert.rejects(
    () =>
      transport.send({
        from: 'sender@example.com',
        to: ['recipient@example.com'],
        subject: 'Hello',
        text: 'Line 1',
      }),
    (error: unknown) =>
      Boolean(
        error &&
          typeof error === 'object' &&
          'code' in error &&
          (error as { code?: unknown }).code === 'smtp_error' &&
          'details' in error &&
          typeof (error as { details?: unknown }).details === 'object' &&
          (error as { details?: { response?: { code?: unknown } } }).details?.response?.code === 550,
      ),
  );
});
