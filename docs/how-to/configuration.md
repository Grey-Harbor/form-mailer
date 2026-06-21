# How-To: Configuration

This guide covers the configuration knobs you'll actually reach for in day-to-day use.
If you want the exact type shapes and return values, see [Reference: API](../reference/api.md).

## Configuration sources

`form-mailer` can be configured from:

- inline code
- environment variables
- an optional dotenv-style file loaded through `FORM_MAILER_ENV_PATH`

## Env loading

By default, `form-mailer` reads the active process environment directly.

If you want to share a common set of defaults for a deployment or local app shell, set
`FORM_MAILER_ENV_PATH` to a dotenv-style file path.

Values from the actual process environment override values loaded from the file.

If the dotenv file contains `FORM_MAILER_SMTP_PASSWORD`, `form-mailer` logs a warning because secrets are safer in live environment variables than in shared files.

## Environment variables

Most setups need:

- `FORM_MAILER_FROM`: sender mailbox used on the outgoing message
- `FORM_MAILER_TO` or `FORM_MAILER_RECIPIENT_MAP`: where messages should be delivered
- `FORM_MAILER_SMTP_HOST`: SMTP server hostname

The rest is optional:

- `FORM_MAILER_TO` (optional): default recipient list used when no `recipientKey` route is matched
- `FORM_MAILER_RECIPIENT_MAP` (optional): JSON object that maps `recipientKey` values to recipient lists
- `FORM_MAILER_RECIPIENTS` (optional): legacy shorthand for named recipient routes in `key:email` form
- `FORM_MAILER_SMTP_PORT` (optional): SMTP server port
- `FORM_MAILER_SMTP_SECURE` (optional): set to `true` for implicit TLS
- `FORM_MAILER_SMTP_STARTTLS` (optional): set to `true` to upgrade the connection with STARTTLS
- `FORM_MAILER_SMTP_SERVERNAME` (optional): TLS server name override
- `FORM_MAILER_SMTP_USERNAME` or `SMTP_UNAME` (optional): SMTP username
- `FORM_MAILER_SMTP_PASSWORD` or `SMTP_TOKEN` (optional): SMTP password or token
- `FORM_MAILER_SUBJECT` (optional): default subject line for outgoing mail
- `FORM_MAILER_REPLY_TO` (optional): reply-to header override
- `FORM_MAILER_ORIGIN_ALLOWLIST` (optional): comma-separated list of allowed submission origins
- `FORM_MAILER_HONEYPOT_FIELD` (optional): honeypot field name used to trap bots
- `FORM_MAILER_REQUIRED_FIELDS` (optional): comma-separated list of required submission fields
- `FORM_MAILER_MAX_PAYLOAD_BYTES` (optional): max submission size in bytes
- `FORM_MAILER_ENV_PATH` (optional): dotenv file path to load before process env

Legacy sender aliases are still accepted:

- `FORM_MAILER_SENDER_EMAIL` can supply the sender email when `FORM_MAILER_FROM` is absent
- `FORM_MAILER_SENDER_NAME` can supply the sender display name

If you're using a local SMTP relay or a development server that does not require auth, you can omit the username and password values.

## Recipient mapping

`recipientMap` is a routing table, not a replacement for the default recipient list.

Use it when different form destinations should go to different inboxes:

- a submission with `recipientKey: "support"` uses the mapped support recipients
- a submission with no `recipientKey` uses `to`
- if a `recipientKey` does not match any map entry, `to` is used as the fallback

If you rely on `recipientMap` alone, make sure every routed submission supplies a matching `recipientKey`.

Example environment value:

```bash
FORM_MAILER_RECIPIENT_MAP='{"support":["support@example.com"],"sales":["sales@example.com","ops@example.com"]}'
```

Legacy shorthand is still accepted for small setups:

```bash
FORM_MAILER_RECIPIENTS='support:support@example.com,sales:sales@example.com'
```

## Practical defaults

- keep `from` as a real mailbox
- use `starttls` for SMTP hosts that support it
- keep `replyTo` aligned with the submitter email when you want replies to go back to the user
- leave `honeypotFieldName` at `website` unless your form already uses that field name
- use full origins such as `https://example.com` in `originAllowlist`

## Code-first options

The code API supports a few configuration patterns that do not map directly to environment variables:

- `subject` can be a string or a function that receives the submission
- `replyTo` can be a string or a function that receives the submission
- `from` can be passed as either a plain email string or a `{ name, email }` address object
