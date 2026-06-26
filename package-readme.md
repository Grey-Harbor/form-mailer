![form-mailer](https://form-mailer.greyharborsoftware.com/brand/social-card.png)

# form-mailer

`form-mailer` is a compact, TypeScript-first package for turning form submissions into email in Node.js apps and serverless handlers.

It is built for teams that want a small delivery layer instead of a full mail platform:

- validate submissions before transport work begins
- route messages through SMTP, the built-in HTTP transport, or a custom adapter
- return typed success and failure outcomes your app can handle explicitly

## Install

```bash
npm install @greyharbor/form-mailer
```

## Quick start

TypeScript:

```ts
import { createFormMailer } from '@greyharbor/form-mailer';

const mailer = createFormMailer({
  from: 'no-reply@example.com',
  to: ['support@example.com'],
  smtp: {
    host: process.env.FORM_MAILER_SMTP_HOST,
    username: process.env.FORM_MAILER_SMTP_USERNAME,
    password: process.env.FORM_MAILER_SMTP_PASSWORD,
    starttls: true,
  },
});

const result = await mailer.send({
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  message: 'I would like to get in touch.',
  fields: {
    topic: 'product question',
  },
});

if (!result.ok) {
  console.error(result.error.code, result.error.message);
}
```

JavaScript:

```js
import { createFormMailer } from '@greyharbor/form-mailer';

const mailer = createFormMailer({
  from: 'no-reply@example.com',
  to: ['support@example.com'],
  smtp: {
    host: process.env.FORM_MAILER_SMTP_HOST,
    username: process.env.FORM_MAILER_SMTP_USERNAME,
    password: process.env.FORM_MAILER_SMTP_PASSWORD,
    starttls: true,
  },
});

const result = await mailer.send({
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  message: 'I would like to get in touch.',
  fields: {
    topic: 'product question',
  },
});

if (!result.ok) {
  console.error(result.error.code, result.error.message);
}
```

If your SMTP provider uses a token instead of a password, use `smtp.token` in code or `FORM_MAILER_SMTP_TOKEN` in env-driven config.

## What it supports

- framework-agnostic form-to-email delivery
- TypeScript and JavaScript consumers
- built-in SMTP delivery
- built-in HTTP transport with request and response mapping hooks
- custom transports through a small `send(message)` interface
- validation for email shape, required fields, honeypot checks, origin allowlists, and payload size

## Documentation

- [Getting Started](./docs/tutorial/getting-started.md)
- [Configuration](./docs/how-to/configuration.md)
- [API Reference](./docs/reference/api.md)
- [Transport Adapters](./docs/reference/adapters.md)
- [Project site](https://form-mailer.greyharborsoftware.com)
