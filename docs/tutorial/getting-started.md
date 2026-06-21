# Tutorial: Getting Started

This tutorial gets you to a first useful `form-mailer` setup with the fewest moving parts.

## Install

```bash
npm install @greyharbor/form-mailer
```

## Create a mailer

```ts
import { createFormMailer } from '@greyharbor/form-mailer';

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

- invalid payloads are rejected before transport work begins
- valid payloads become plain text and HTML mail bodies
- transport failures come back as typed errors you can handle in your app
