# Reference: API

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

## Result shape

`send()` returns:

- `ok: true` with an optional `messageId` and delivery envelope
- `ok: false` with a typed error object

## Error codes

- `config_error`
- `validation_error`
- `transport_error`
- `smtp_error`

