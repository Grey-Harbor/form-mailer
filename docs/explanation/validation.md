# Explanation: Validation

`form-mailer` treats validation as the first real step in delivery.

Nothing is sent until the submission has passed a small set of checks that are meant to catch the most common failure modes early:

- malformed submitter email
- missing required values
- bot traffic caught by a honeypot field
- origins that are missing, invalid, or not on the allowlist
- oversized payloads

## Where validation happens

The mailer runs validation before any message building or transport work begins.

That means:

- `validate(submission)` gives you the rule results directly
- `send(submission)` runs the same checks first
- a failed validation never reaches the adapter or SMTP transport

This keeps adapters simple and prevents network work for requests that were going to be rejected anyway.

## The validation sequence

Validation runs in a predictable order:

1. check the submitter email
2. check configured required fields
3. check the honeypot field
4. check the origin allowlist
5. check the serialized payload size

The result is always a `ValidationResult` with:

- `ok`
- `issues`

Each issue includes:

- `field`
- `code`
- `message`

Validation is accumulative, not fail-fast.
The package keeps running the later checks even after an earlier rule has failed, so one submission can return multiple issues in a single result.

## Email validation

`submission.email` is required and must match a simple mailbox pattern.

More specifically, the value is:

- read from `submission.email`
- coerced to a string
- trimmed
- checked against a lightweight `local@domain.tld` style regex

That means this rule is looking for a plausible email address shape, not proving that the mailbox exists or can receive mail.

In practical terms, the rule rejects values that are missing or obviously malformed, including:

- an empty string
- strings without `@`
- strings with whitespace inside the address
- strings without a dot in the domain portion

If it fails, the validation result includes:

- field: `email`
- code: `invalid_email`

The package keeps this check intentionally lightweight. It is meant to catch obviously bad input before delivery, not to fully verify mailbox ownership, DNS, or remote acceptability.

## Required field checks

`requiredFields` lets you name values that must be present before mail can be sent.

Each required field is resolved from:

- a top-level submission property first
- `submission.fields` second

That means a requirement like `email` or `subject` can match a top-level property, while something like `company` can come from `submission.fields.company`.

The resolution is name-based only.
The package does not distinguish between "core" fields and custom fields once it starts looking up a required field name.

For this rule, "missing" means the resolved value is exactly:

- `undefined`
- `null`
- `''`

Important edge cases:

- `'   '` is not considered empty because whitespace-only strings are not trimmed here
- `0` passes because it is not empty
- `false` passes because it is not empty
- `[]` also passes because only `undefined`, `null`, and `''` count as empty

If a required field is missing, the validation result includes:

- field: the configured field name
- code: `required_field_missing`

## Honeypot handling

The honeypot is meant to catch simple bot traffic without affecting real users.

When the mailer config is resolved, `honeypotFieldName` defaults to `website`.
Validation looks up that field in the same way as required fields:

- top-level submission property first
- `submission.fields` second

What gets validated here is not the shape or meaning of the value.
The package does not try to decide whether the field contains a valid website, URL, or any other specific content.
It only checks whether the field was populated at all.

The rule is:

- `undefined` passes
- `null` passes
- `''` passes
- any other value fails

That means values such as these all trigger the honeypot:

- `'spam'`
- `'https://example.com'`
- `'   '`
- `0`
- `false`
- `[]`

If the honeypot field contains any non-empty value, validation fails with:

- field: the honeypot field name
- code: `honeypot_triggered`

This is why forms should render the honeypot input but keep it hidden from normal users.

In practice, that means:

- a real user who never touches the hidden field passes
- a bot that fills every visible or hidden input usually fails

## Origin allowlist checks

If `originAllowlist` is configured, every submission must include `submission.origin`.

This rule is inactive when the allowlist is absent or empty.
Once the allowlist contains at least one entry, origin becomes mandatory.

Validation then:

- parses the submitted origin with `new URL(...)`
- extracts the normalized `.origin` value from that URL
- compares that normalized origin by exact string match against the configured allowlist

That produces three distinct failure cases:

- `origin_missing` when the allowlist is configured but the submission omitted `origin`
- `origin_invalid` when the submitted value is not a valid URL
- `origin_not_allowed` when the parsed origin is valid but not in the allowlist

The normalization step matters.
If the submission sends `https://example.com/contact?x=1`, the comparison uses `https://example.com`, not the path or query string.

The exact-match rule also matters:

- scheme is significant
- host is significant
- port is significant when present
- paths are ignored because `.origin` does not include them

The allowlist expects full origins such as `https://example.com`, not paths or hostnames by themselves.

## Payload limits

Payload size is checked against the serialized submission body.

The package:

- serializes the submission with `JSON.stringify(submission)`
- measures the byte length with `TextEncoder`
- compares it to `maxPayloadBytes`

So the limit is applied to the whole submission object as submitted, not just `message` and not just user-visible fields.

That includes any combination of:

- top-level fields like `email`, `subject`, and `origin`
- `submission.fields`
- any extra nested values that end up in the serialized payload

The serialization path is cycle-safe.
If a JavaScript caller includes circular object references in `submission.fields`, the package renders those loops as `"[Circular]"` instead of throwing during validation or message assembly.

The default limit is `64 * 1024` bytes.

If the payload is too large, validation fails with:

- field: `submission`
- code: `payload_too_large`

This is a practical guardrail for form use cases, not a streaming upload system.
It is best thought of as a request-size ceiling for the mail submission payload.

## Sanitization after validation

Some safety work happens after validation, during config resolution and message assembly.

Header-bearing values are sanitized by stripping CR and LF characters before they are used in:

- `from`
- `replyTo`
- `subject`
- recipient values
- formatted field labels in the generated message

In practice, sanitization means:

- newline characters are replaced with spaces
- leading and trailing whitespace is trimmed
- the goal is to prevent header injection through multi-line values

This matters because validation is not only about whether a submission is allowed.
It is also about making sure the values that do become headers are safe to render into an outbound message.

For the exact API shape, see [Reference: API](../reference/api.md).
