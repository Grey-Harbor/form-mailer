import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfigFromEnv } from '../src/config.js';

test('loads configs.yaml from the deployment root', { concurrency: false }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'form-mailer-'));
  const file = join(dir, 'configs.yaml');
  await writeFile(
    file,
    [
      'from: sender@example.com',
      'to:',
      '  - recipient@example.com',
      'smtp:',
      '  host: smtp.example.com',
      '  username: user',
      '  token: secret',
    ].join('\n'),
  );

  const originalCwd = process.cwd();
  try {
    process.chdir(dir);
    const config = await loadConfigFromEnv({});
    assert.deepEqual(config.from, { email: 'sender@example.com' });
    assert.deepEqual(config.to, ['recipient@example.com']);
    assert.equal(config.smtp?.host, 'smtp.example.com');
  } finally {
    process.chdir(originalCwd);
  }
});

test('env config path overrides deployment root discovery', { concurrency: false }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'form-mailer-'));
  const rootFile = join(dir, 'configs.yaml');
  const overrideFile = join(dir, 'override.yaml');
  await writeFile(
    rootFile,
    [
      'from: root@example.com',
      'to:',
      '  - root-recipient@example.com',
      'smtp:',
      '  host: smtp.root.example.com',
    ].join('\n'),
  );
  await writeFile(
    overrideFile,
    [
      'from: override@example.com',
      'to:',
      '  - override@example.com',
      'smtp:',
      '  host: smtp.override.example.com',
    ].join('\n'),
  );

  const originalCwd = process.cwd();
  try {
    process.chdir(dir);
    const config = await loadConfigFromEnv({ FORM_MAILER_CONFIG_PATH: overrideFile });
    assert.deepEqual(config.from, { email: 'override@example.com' });
    assert.deepEqual(config.to, ['override@example.com']);
    assert.equal(config.smtp?.host, 'smtp.override.example.com');
  } finally {
    process.chdir(originalCwd);
  }
});
