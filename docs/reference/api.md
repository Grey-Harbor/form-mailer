# Reference: API

## Top-level exports

The package root exports the supported entrypoints:

- `createFormMailer`
- `createHttpTransport`
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

## `createHttpTransport(config)`

Creates a transport that delivers outgoing mail over an HTTP API.

Use it when you want to:

- provide a built-in REST transport explicitly to `createFormMailer()`
- post the assembled `OutgoingMail` JSON shape to a provider endpoint
- reuse the package's built-in bearer-token HTTP behavior instead of writing a custom adapter

The `config` object uses `HttpTransportConfig`, which supports:

- `url`
- `token`
- `headers`

Important behavior:

- `url` must be a valid absolute URL
- requests always use `POST`
- the request body is JSON serialized from `OutgoingMail`
- `content-type` is always kept compatible with JSON delivery
- `authorization: Bearer <token>` is added when `token` is present

For transport-level expectations, see [Reference: Adapters](./adapters.md).

## `createSmtpTransport(config)`

Creates a transport that delivers outgoing mail over SMTP.

Use it when you want to:

- provide a transport explicitly to `createFormMailer()`
- reuse the built-in SMTP behavior behind the shared transport interface
- swap between SMTP and custom adapters without changing the mailer contract

The `config` object uses `SmtpConnectionConfig`, which supports:

- `host`
- `port`
- `secure`
- `starttls`
- `username`
- `password`
- `tls`

Important behavior:

- `host` is required for a real SMTP connection
- `port` defaults to `465` when `secure` is true
- `port` defaults to `587` otherwise
- `starttls` upgrades a non-implicit TLS connection after `EHLO`
- authentication runs only when both `username` and `password` are present

For transport-level expectations, see [Reference: Adapters](./adapters.md).

## `loadConfigFromEnv()`

Loads a `FormMailerConfig` from environment variables.

The loader:

- reads `process.env` by default
- optionally loads a dotenv-style file from `FORM_MAILER_ENV_PATH`
- lets live environment variables override values from that file

It returns a promise because reading the optional env file is asynchronous.

For the supported environment variables and practical setup guidance, use [How-To: Configuration](../how-to/configuration.md).

## `createFormMailerError(code, message, details?)`

Creates a typed `FormMailerError`.

Use it when you want your own code to return or throw errors that match the package error shape.

The resulting error includes:

- `message`
- `code`
- optional `details`

## `isFormMailerError(value)`

Checks whether an unknown value matches the package error shape.

Use it when you need to narrow an unknown error before reading:

- `error.code`
- `error.details`

## Submission shape

`FormMailSubmission` supports:

- `name`
- `email`
- `subject`
- `message`
- `recipientKey`
- `origin`
- `fields`

Details worth calling out:

- there is no permanently reserved top-level honeypot property in the validation flow
- the honeypot is resolved by the configured `honeypotFieldName`
- that field name can point at a top-level submission property or a value inside `submission.fields`
- a property literally named `honeypot` is only meaningful if you configure `honeypotFieldName: 'honeypot'`

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
- `http`
- `smtp`

Details worth calling out:

- `from` can be a plain email string or a `{ name, email }` address object
- `subject` can be a string or a function that receives the submission
- `replyTo` can be a string or a function that receives the submission
- `transport` is optional when `http` or `smtp` is provided
- `http` is optional when `transport` is provided
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
If the file contains `FORM_MAILER_SMTP_PASSWORD`, `FORM_MAILER_SMTP_TOKEN`, or `FORM_MAILER_HTTP_TOKEN`, the loader logs a warning because runtime environment variables are the preferred place for secrets.

The env loader reads these SMTP values:

- `FORM_MAILER_FROM` is the primary sender value
- `FORM_MAILER_SENDER_EMAIL` can supply the sender email when `FORM_MAILER_FROM` is absent
- `FORM_MAILER_SENDER_NAME` can supply the sender display name
- `FORM_MAILER_SMTP_USERNAME` supplies the SMTP username
- `FORM_MAILER_SMTP_PASSWORD` supplies the SMTP password
- `FORM_MAILER_SMTP_TOKEN` supplies the SMTP token

The env loader reads these HTTP values:

- `FORM_MAILER_HTTP_URL` selects the built-in HTTP transport endpoint
- `FORM_MAILER_HTTP_TOKEN` supplies the bearer token for the built-in HTTP transport
- `FORM_MAILER_HTTP_HEADERS` supplies optional JSON headers with string values

If both `FORM_MAILER_HTTP_URL` and `FORM_MAILER_SMTP_HOST` are set, `loadConfigFromEnv()` rejects with `config_error` instead of guessing which built-in transport to use.

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
