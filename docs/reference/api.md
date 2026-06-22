# Reference: API

## Top-level exports

The package root exports the supported entrypoints:

- `createFormMailer`
- `createSmtpTransport`
- `loadConfigFromEnv`
- `createFormMailerError`
- `isFormMailerError`

It also exports the public TypeScript types used by those entrypoints.

## `createFormMailer(config)`

Creates a mailer instance.

The returned mailer exposes:

- `validate(submission)`
- `send(submission)`

`validate(submission)` returns a structured validation result.

`send(submission)` validates first, then returns a promise for a typed delivery outcome.

For the reasoning behind the validation pipeline, see [Explanation: Validation](../explanation/validation.md).

## Submission shape

`FormMailSubmission` supports:

- `name`
- `email`
- `subject`
- `message`
- `recipientKey`
- `origin`
- `honeypot`
- `fields`

## Configuration shape

`FormMailerConfig` supports:

- `from`
- `to`
- `recipientMap`
- `subject`
- `replyTo`
- `originAllowlist`
- `honeypotFieldName`
- `requiredFields`
- `maxPayloadBytes`
- `transport`
- `smtp`

Details worth calling out:

- `from` can be a plain email string or a `{ name, email }` address object
- `subject` can be a string or a function that receives the submission
- `replyTo` can be a string or a function that receives the submission
- `transport` is optional when `smtp` is provided
- `honeypotFieldName` defaults to `website` when omitted
- `requiredFields` defaults to an empty list
- `maxPayloadBytes` defaults to `64 * 1024`

## Validation behavior

`validate(submission)` checks the submission in this order:

1. submitter email
2. configured required fields
3. honeypot field
4. origin allowlist
5. payload size

The returned `ValidationResult` always includes:

- `ok`
- `issues`

Each `ValidationIssue` includes:

- `field`
- `code`
- `message`

Validation accumulates issues.
It does not stop after the first failure.

Current issue codes are:

- `invalid_email`
- `required_field_missing`
- `honeypot_triggered`
- `origin_missing`
- `origin_invalid`
- `origin_not_allowed`
- `payload_too_large`

Notes worth calling out:

- `email` is checked with a lightweight address-shape regex after trimming
- `requiredFields` checks top-level submission properties first and `submission.fields` second
- only `undefined`, `null`, and `''` count as empty for `requiredFields` and honeypot checks
- `honeypotFieldName` defaults to `website`
- the honeypot check only asks whether the field was populated at all
- `originAllowlist` expects full origins such as `https://example.com`
- origin comparison is done against the normalized `new URL(submission.origin).origin` value
- `maxPayloadBytes` is measured against the JSON-serialized submission body

## Environment loading

`loadConfigFromEnv()` reads the active process environment directly.

If `FORM_MAILER_ENV_PATH` is set, it loads a dotenv-style file first and then lets process env values override the file defaults.
If the file contains `FORM_MAILER_SMTP_PASSWORD`, the loader logs a warning because runtime environment variables are the preferred place for secrets.

The env loader also accepts these legacy aliases:

- `FORM_MAILER_FROM` is the primary sender value
- `FORM_MAILER_SENDER_EMAIL` can supply the sender email when `FORM_MAILER_FROM` is absent
- `FORM_MAILER_SENDER_NAME` can supply the sender display name
- `FORM_MAILER_SMTP_USERNAME` falls back to `SMTP_UNAME`
- `FORM_MAILER_SMTP_PASSWORD` falls back to `SMTP_TOKEN`

## Recipient mapping

`recipientMap` is an optional routing table keyed by `FormMailSubmission.recipientKey`.

- if the submission sets `recipientKey` and the key exists in `recipientMap`, the mapped recipients are used
- otherwise the package falls back to `to`
- `to` is still the default recipient list for submissions that do not set a route key

Transport adapter details live in [Reference: Adapters](./adapters.md).

## Result shape

`send()` returns:

- `ok: true` with an optional `messageId` and delivery envelope
- `ok: false` with a typed error object

The success envelope includes the resolved `from` address and final recipient list.

## Error codes

- `config_error`
- `validation_error`
- `transport_error`
- `smtp_error`
