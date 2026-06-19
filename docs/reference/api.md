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

Creates a mailer instance with:

- `validate(submission)`
- `send(submission)`

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

## Environment loading

`loadConfigFromEnv()` reads the active process environment directly.

If `FORM_MAILER_ENV_PATH` is set, it loads a dotenv-style file first and then lets process env values override the file defaults.
If the file contains `FORM_MAILER_SMTP_PASSWORD`, the loader logs a warning because runtime environment variables are the preferred place for secrets.

## Recipient mapping

`recipientMap` is an optional routing table keyed by `FormMailSubmission.recipientKey`.

- if the submission sets `recipientKey` and the key exists in `recipientMap`, the mapped recipients are used
- otherwise the package falls back to `to`
- `to` is still the default recipient list for submissions that do not set a route key

## Result shape

`send()` returns:

- `ok: true` with an optional `messageId` and delivery envelope
- `ok: false` with a typed error object

## Error codes

- `config_error`
- `validation_error`
- `transport_error`
- `smtp_error`
