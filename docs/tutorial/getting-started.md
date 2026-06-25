# Tutorial: Getting Started

This tutorial gets you to a first useful `form-mailer` setup with the fewest moving parts.

The package works well in a normal Node.js application and can be consumed from JavaScript or TypeScript.

For the full config surface after you have this working, continue with [How-To: Configuration](../how-to/configuration.md).

## Install

```bash
npm install @greyharbor/form-mailer
```

## Create a mailer

SMTP example:

TypeScript example:

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
```

JavaScript example:

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
```

If your HTTP provider expects a different request or response contract, keep the built-in transport and add code-level `mapRequest` or `parseResponse` hooks. For the exact hook shapes, see [Reference: API](../reference/api.md).

If your provider issues a token instead of a password, use `token` in code or `FORM_MAILER_SMTP_TOKEN` in env config:

```ts
const mailer = createFormMailer({
  from: 'no-reply@example.com',
  to: ['support@example.com'],
  smtp: {
    host: process.env.FORM_MAILER_SMTP_HOST,
    username: process.env.FORM_MAILER_SMTP_USERNAME,
    token: process.env.FORM_MAILER_SMTP_TOKEN,
    starttls: true,
  },
});
```

HTTP example:

TypeScript example:

```ts
import { createFormMailer } from '@greyharbor/form-mailer';

const mailer = createFormMailer({
  from: 'no-reply@example.com',
  to: ['support@example.com'],
  http: {
    url: process.env.FORM_MAILER_HTTP_URL!,
    token: process.env.FORM_MAILER_HTTP_TOKEN,
  },
});
```

JavaScript example:

```js
import { createFormMailer } from '@greyharbor/form-mailer';

const mailer = createFormMailer({
  from: 'no-reply@example.com',
  to: ['support@example.com'],
  http: {
    url: process.env.FORM_MAILER_HTTP_URL,
    token: process.env.FORM_MAILER_HTTP_TOKEN,
  },
});
```

## Send a submission

TypeScript example:

```ts
const result = await mailer.send({
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'I would like to get in touch.',
  fields: {
    topic: 'product question',
  },
});

if (!result.ok) {
  console.error(result.error.code, result.error.message);
}
```

JavaScript example:

```js
const result = await mailer.send({
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'I would like to get in touch.',
  fields: {
    topic: 'product question',
  },
});

if (!result.ok) {
  console.error(result.error.code, result.error.message);
}
```

## What to expect

- invalid payloads are rejected before transport work begins, following the checks in [Explanation: Validation](../explanation/validation.md)
- valid payloads become plain text and HTML mail bodies
- transport failures come back as typed errors you can handle in your app, using the result shape described in [Reference: API](../reference/api.md)
