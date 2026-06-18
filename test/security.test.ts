import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { validateSubmission } from '../src/validation.js';

test('rejects payloads larger than the configured limit', () => {
  const result = validateSubmission(
    {
      email: 'hello@example.com',
      message: 'x'.repeat(128),
      fields: { extra: 'payload' },
    },
    {
      requiredFields: [],
      honeypotFieldName: 'website',
      maxPayloadBytes: 32,
      originAllowlist: [],
    },
  );

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === 'payload_too_large'));
});

test('rejects honeypot submissions', () => {
  const result = validateSubmission(
    {
      email: 'hello@example.com',
      honeypot: 'bot-filled',
      fields: {},
    },
    {
      requiredFields: [],
      honeypotFieldName: 'honeypot',
      maxPayloadBytes: 1024,
      originAllowlist: [],
    },
  );

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === 'honeypot_triggered'));
});

test('rejects submissions from disallowed origins', () => {
  const result = validateSubmission(
    {
      email: 'hello@example.com',
      origin: 'https://evil.example.com/form',
      fields: {},
    },
    {
      requiredFields: [],
      honeypotFieldName: 'website',
      maxPayloadBytes: 1024,
      originAllowlist: ['https://example.com'],
    },
  );

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === 'origin_not_allowed'));
});
