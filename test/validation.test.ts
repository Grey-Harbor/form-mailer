import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { validateSubmission } from '../src/validation.js';

test('rejects invalid email addresses', () => {
  const result = validateSubmission(
    { email: 'not-an-email', fields: {} },
    { requiredFields: [], maxPayloadBytes: 1024 },
  );

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.field === 'email'));
});

test('accepts a minimal valid submission', () => {
  const result = validateSubmission(
    { email: 'hello@example.com', fields: { name: 'Ada' } },
    { requiredFields: [], maxPayloadBytes: 1024 },
  );

  assert.equal(result.ok, true);
  assert.equal(result.issues.length, 0);
});
