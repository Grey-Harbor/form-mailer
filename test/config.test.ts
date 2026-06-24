import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTransportFromConfig, loadConfigFromEnv } from '../src/config.js';
import { isFormMailerError } from '../src/errors.js';

test('loads config from process env without reading a config file', { concurrency: false }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'form-mailer-'));
  await writeFile(join(dir, 'config.yaml'), 'this: should-not-be-used');

  const originalCwd = process.cwd();
  try {
    process.chdir(dir);
    const config = await loadConfigFromEnv({
      FORM_MAILER_FROM: 'sender@example.com',
      FORM_MAILER_TO: 'recipient@example.com',
      FORM_MAILER_SMTP_HOST: 'smtp.example.com',
    });

    assert.deepEqual(config.from, { email: 'sender@example.com' });
    assert.deepEqual(config.to, ['recipient@example.com']);
    assert.equal(config.smtp?.host, 'smtp.example.com');
  } finally {
    process.chdir(originalCwd);
  }
});

test('loads defaults from FORM_MAILER_ENV_PATH and lets process env win', { concurrency: false }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'form-mailer-'));
  const envFile = join(dir, '.env');
  await writeFile(
    envFile,
    [
      'FORM_MAILER_FROM=file@example.com',
      'FORM_MAILER_TO=file-recipient@example.com',
      'FORM_MAILER_SMTP_HOST=smtp.file.example.com',
      'FORM_MAILER_SMTP_USERNAME=file-user',
      'FORM_MAILER_SMTP_TOKEN=file-secret',
      'FORM_MAILER_SUBJECT=from file',
      'FORM_MAILER_RECIPIENT_MAP={"support":"support@example.com"}',
    ].join('\n'),
  );

  const config = await loadConfigFromEnv({
    FORM_MAILER_ENV_PATH: envFile,
    FORM_MAILER_FROM: 'runtime@example.com',
    FORM_MAILER_SUBJECT: 'from runtime',
  });

  assert.deepEqual(config.from, { email: 'runtime@example.com' });
  assert.deepEqual(config.to, ['file-recipient@example.com']);
  assert.equal(config.smtp?.host, 'smtp.file.example.com');
  assert.equal(config.smtp?.username, 'file-user');
  assert.equal(config.smtp?.password, 'file-secret');
  assert.equal(config.subject, 'from runtime');
  assert.deepEqual(config.recipientMap, { support: ['support@example.com'] });
});

test('warns when SMTP secrets are loaded from FORM_MAILER_ENV_PATH', { concurrency: false }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'form-mailer-'));
  const envFile = join(dir, '.env');
  await writeFile(
    envFile,
    [
      'FORM_MAILER_FROM=file@example.com',
      'FORM_MAILER_TO=file-recipient@example.com',
      'FORM_MAILER_SMTP_HOST=smtp.file.example.com',
      'FORM_MAILER_SMTP_PASSWORD=file-password',
      'FORM_MAILER_SMTP_TOKEN=file-token',
    ].join('\n'),
  );

  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map(String).join(' '));
  };

  try {
    await loadConfigFromEnv({
      FORM_MAILER_ENV_PATH: envFile,
      FORM_MAILER_SMTP_PASSWORD: 'runtime-password',
      FORM_MAILER_SMTP_TOKEN: 'runtime-token',
    });
  } finally {
    console.warn = originalWarn;
  }

  assert.ok(warnings.some((warning) => warning.includes('FORM_MAILER_SMTP_PASSWORD')));
  assert.ok(warnings.some((warning) => warning.includes('FORM_MAILER_SMTP_TOKEN')));
  assert.ok(warnings.some((warning) => warning.includes('prefer supplying secrets through the live environment')));
});

test('loads HTTP config from process env', async () => {
  const config = await loadConfigFromEnv({
    FORM_MAILER_FROM: 'sender@example.com',
    FORM_MAILER_TO: 'recipient@example.com',
    FORM_MAILER_HTTP_URL: 'https://api.example.com/send',
    FORM_MAILER_HTTP_TOKEN: 'http-token',
    FORM_MAILER_HTTP_HEADERS: '{"x-provider":"demo"}',
  });

  assert.deepEqual(config.from, { email: 'sender@example.com' });
  assert.deepEqual(config.to, ['recipient@example.com']);
  assert.deepEqual(config.http, {
    url: 'https://api.example.com/send',
    token: 'http-token',
    headers: { 'x-provider': 'demo' },
  });
});

test('loads HTTP defaults from FORM_MAILER_ENV_PATH and lets process env win', { concurrency: false }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'form-mailer-'));
  const envFile = join(dir, '.env');
  await writeFile(
    envFile,
    [
      'FORM_MAILER_FROM=file@example.com',
      'FORM_MAILER_TO=file-recipient@example.com',
      'FORM_MAILER_HTTP_URL=https://file.example.com/send',
      'FORM_MAILER_HTTP_TOKEN=file-http-token',
      'FORM_MAILER_HTTP_HEADERS={"x-source":"file"}',
    ].join('\n'),
  );

  const config = await loadConfigFromEnv({
    FORM_MAILER_ENV_PATH: envFile,
    FORM_MAILER_FROM: 'runtime@example.com',
    FORM_MAILER_HTTP_URL: 'https://runtime.example.com/send',
  });

  assert.deepEqual(config.from, { email: 'runtime@example.com' });
  assert.equal(config.http?.url, 'https://runtime.example.com/send');
  assert.equal(config.http?.token, 'file-http-token');
  assert.deepEqual(config.http?.headers, { 'x-source': 'file' });
});

test('warns when HTTP token is loaded from FORM_MAILER_ENV_PATH', { concurrency: false }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'form-mailer-'));
  const envFile = join(dir, '.env');
  await writeFile(
    envFile,
    [
      'FORM_MAILER_FROM=file@example.com',
      'FORM_MAILER_TO=file-recipient@example.com',
      'FORM_MAILER_HTTP_URL=https://file.example.com/send',
      'FORM_MAILER_HTTP_TOKEN=file-http-token',
    ].join('\n'),
  );

  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map(String).join(' '));
  };

  try {
    await loadConfigFromEnv({
      FORM_MAILER_ENV_PATH: envFile,
    });
  } finally {
    console.warn = originalWarn;
  }

  assert.ok(warnings.some((warning) => warning.includes('FORM_MAILER_HTTP_TOKEN')));
});

test('does not use SMTP_UNAME as a username alias', { concurrency: false }, async () => {
  const config = await loadConfigFromEnv({
    FORM_MAILER_FROM: 'sender@example.com',
    FORM_MAILER_TO: 'recipient@example.com',
    FORM_MAILER_SMTP_HOST: 'smtp.example.com',
    SMTP_UNAME: 'legacy-user',
  });

  assert.equal(config.smtp?.username, undefined);
});

test('rejects malformed FORM_MAILER_HTTP_HEADERS content', async () => {
  await assert.rejects(
    () =>
      loadConfigFromEnv({
        FORM_MAILER_FROM: 'sender@example.com',
        FORM_MAILER_TO: 'recipient@example.com',
        FORM_MAILER_HTTP_URL: 'https://api.example.com/send',
        FORM_MAILER_HTTP_HEADERS: '{not-valid-json}',
      }),
    (error: unknown) => isFormMailerError(error) && error.code === 'config_error',
  );
});

test('rejects non-object FORM_MAILER_HTTP_HEADERS values', async () => {
  await assert.rejects(
    () =>
      loadConfigFromEnv({
        FORM_MAILER_FROM: 'sender@example.com',
        FORM_MAILER_TO: 'recipient@example.com',
        FORM_MAILER_HTTP_URL: 'https://api.example.com/send',
        FORM_MAILER_HTTP_HEADERS: '["x-provider"]',
      }),
    (error: unknown) => isFormMailerError(error) && error.code === 'config_error',
  );
});

test('rejects non-string FORM_MAILER_HTTP_HEADERS entries', async () => {
  await assert.rejects(
    () =>
      loadConfigFromEnv({
        FORM_MAILER_FROM: 'sender@example.com',
        FORM_MAILER_TO: 'recipient@example.com',
        FORM_MAILER_HTTP_URL: 'https://api.example.com/send',
        FORM_MAILER_HTTP_HEADERS: '{"x-provider":42}',
      }),
    (error: unknown) => isFormMailerError(error) && error.code === 'config_error',
  );
});

test('rejects a missing FORM_MAILER_ENV_PATH file', { concurrency: false }, async () => {
  await assert.rejects(
    () =>
      loadConfigFromEnv({
        FORM_MAILER_ENV_PATH: join(tmpdir(), 'form-mailer-missing.env'),
        FORM_MAILER_FROM: 'sender@example.com',
        FORM_MAILER_TO: 'recipient@example.com',
        FORM_MAILER_SMTP_HOST: 'smtp.example.com',
      }),
    (error: unknown) => isFormMailerError(error) && error.code === 'config_error',
  );
});

test('rejects malformed dotenv content', { concurrency: false }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'form-mailer-'));
  const envFile = join(dir, '.env');
  await writeFile(envFile, ['FORM_MAILER_FROM=sender@example.com', 'not valid'].join('\n'));

  await assert.rejects(
    () =>
      loadConfigFromEnv({
        FORM_MAILER_ENV_PATH: envFile,
        FORM_MAILER_TO: 'recipient@example.com',
        FORM_MAILER_SMTP_HOST: 'smtp.example.com',
      }),
    (error: unknown) => isFormMailerError(error) && error.code === 'config_error',
  );
});

test('rejects config when HTTP and SMTP transports are both configured in env', async () => {
  await assert.rejects(
    () =>
      loadConfigFromEnv({
        FORM_MAILER_FROM: 'sender@example.com',
        FORM_MAILER_TO: 'recipient@example.com',
        FORM_MAILER_HTTP_URL: 'https://api.example.com/send',
        FORM_MAILER_SMTP_HOST: 'smtp.example.com',
      }),
    (error: unknown) => isFormMailerError(error) && error.code === 'config_error',
  );
});

test('createTransportFromConfig prefers an explicit transport over built-in HTTP or SMTP config', async () => {
  const transport = {
    async send() {
      return { messageId: 'explicit-id' };
    },
  };

  const resolved = createTransportFromConfig({
    from: 'sender@example.com',
    transport,
    http: { url: 'https://api.example.com/send' },
    smtp: { host: 'smtp.example.com' },
  });

  assert.equal(resolved, transport);
});

test('createTransportFromConfig prefers built-in HTTP over SMTP config', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  globalThis.fetch = (async (input: string | URL | Request) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({ messageId: 'http-id' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const transport = createTransportFromConfig({
      from: 'sender@example.com',
      http: { url: 'https://api.example.com/send' },
      smtp: { host: 'smtp.example.com' },
    });

    const result = await transport.send({
      from: 'sender@example.com',
      to: ['recipient@example.com'],
      subject: 'Hello',
      text: 'Body',
    });

    assert.equal(requestedUrl, 'https://api.example.com/send');
    assert.equal(result.messageId, 'http-id');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
