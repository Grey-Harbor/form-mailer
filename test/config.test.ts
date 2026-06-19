import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfigFromEnv } from '../src/config.js';
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
      'FORM_MAILER_SMTP_PASSWORD=file-secret',
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

test('warns when FORM_MAILER_SMTP_PASSWORD is loaded from FORM_MAILER_ENV_PATH', { concurrency: false }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'form-mailer-'));
  const envFile = join(dir, '.env');
  await writeFile(
    envFile,
    [
      'FORM_MAILER_FROM=file@example.com',
      'FORM_MAILER_TO=file-recipient@example.com',
      'FORM_MAILER_SMTP_HOST=smtp.file.example.com',
      'FORM_MAILER_SMTP_PASSWORD=file-secret',
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
      FORM_MAILER_SMTP_PASSWORD: 'runtime-secret',
    });
  } finally {
    console.warn = originalWarn;
  }

  assert.ok(warnings.some((warning) => warning.includes('FORM_MAILER_SMTP_PASSWORD')));
  assert.ok(warnings.some((warning) => warning.includes('prefer supplying secrets through the live environment')));
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
