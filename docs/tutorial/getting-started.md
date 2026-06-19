# Tutorial: Getting Started

This tutorial walks through the smallest useful `form-mailer` setup.

## Install

```bash
npm install @grey-harbor/form-mailer
```

## Create a mailer

```ts
import { createFormMailer } from '@grey-harbor/form-mailer';

const mailer = createFormMailer({
  from: 'no-reply@example.com',
  to: ['support@example.com'],
  smtp: {
    host: process.env.SMTP_HOST,
    username: process.env.SMTP_USERNAME,
    password: process.env.SMTP_PASSWORD,
    starttls: true,
  },
});
```

## Send a submission

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

## What to expect

- invalid payloads fail before transport work begins
- valid payloads are converted into a plain text and HTML mail body
- transport errors are returned as typed failures
