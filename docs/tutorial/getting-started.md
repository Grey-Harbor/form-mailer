# Tutorial: Getting Started

This tutorial gets you to a first useful `form-mailer` setup with the fewest moving parts.

The package works well in a normal Node.js application and can be consumed from JavaScript or TypeScript.

For the full config surface after you have this working, continue with [How-To: Configuration](../how-to/configuration.md).

## Install

```bash
npm install @greyharbor/form-mailer
```

## Create a mailer

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

If your provider issues a token instead of a password, use `FORM_MAILER_SMTP_TOKEN` for the secret value.

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
